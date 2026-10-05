import "server-only";

const siteModels = new Set([
  "student", "importFile", "importMutation", "importPreview", "examLocation", "enrollment", "forfeitRequest", "score",
  "checkInSession", "checkIn", "systemSetting", "rateLimitBucket",
]);

export type ImportMutationCapture = {
  activeImportFileId?: string;
  rows: Array<{ modelName: string; importFileId: string | null; recordId: string | null; action: string; beforeData: unknown; afterData: unknown }>;
};

function addSiteScope(model: string, method: string, input: Record<string, any>, siteId: string) {
  const args: Record<string, any> = { ...input };
  if (input.where) args.where = { ...input.where };
  if (input.data && !Array.isArray(input.data)) args.data = { ...input.data };
  if (siteModels.has(model)) {
    if (args.where) args.where = { ...args.where, siteId };
    if (args.data) {
      if (Array.isArray(args.data)) args.data = args.data.map((row: object) => ({ ...row, siteId }));
      else args.data = { ...args.data, siteId };
    }
    if (args.create) args.create = { ...args.create, siteId };

    const unique = args.where ?? {};
    if (model === "examLocation" && ["findUnique", "upsert"].includes(method) && typeof unique.code === "string") {
      const code = unique.code;
      delete unique.code;
      unique.siteId_code = { siteId, code };
    }
    if (model === "enrollment" && unique.studentId_academicYear_examRound_sourceType) {
      const old = unique.studentId_academicYear_examRound_sourceType;
      delete unique.studentId_academicYear_examRound_sourceType;
      unique.siteId_studentId_academicYear_examRound_sourceType = { siteId, ...old };
    }
    if (model === "enrollment" && method === "findUnique" && typeof unique.barcode === "string") {
      const barcode = unique.barcode;
      delete unique.barcode;
      unique.siteId_barcode = { siteId, barcode };
    }
    if (model === "systemSetting" && ["findUnique", "upsert"].includes(method) && typeof unique.key === "string") {
      const key = unique.key;
      delete unique.key;
      unique.siteId_key = { siteId, key };
    }
    if (args.where) args.where = unique;
  }
  return args;
}

export function scopedPrisma<T extends object>(client: T, siteId: string, capture?: ImportMutationCapture): T {
  return new Proxy(client, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof property === "string" && siteModels.has(property) && value && typeof value === "object") {
        return new Proxy(value, {
          get(modelTarget, method, modelReceiver) {
            const operation = Reflect.get(modelTarget, method, modelReceiver);
            if (typeof operation !== "function") return operation;
            return async (...args: unknown[]) => {
              const first = args[0];
              if (!first || typeof first !== "object") return operation.apply(modelTarget, args);
              const operationName = String(method);
              const scopedArgs = addSiteScope(property, operationName, first as Record<string, any>, siteId);
              if (!capture || !capture.activeImportFileId || property === "importFile" || !["create", "createManyAndReturn", "upsert", "update", "updateMany"].includes(operationName)) {
                const result = await operation.apply(modelTarget, [scopedArgs, ...args.slice(1)]);
                if (property === "importFile" && operationName === "create" && result?.id) capture && (capture.activeImportFileId = result.id);
                return result;
              }

              const normalizeWhere = (where: Record<string, any> = {}) => {
                const query: Record<string, any> = { ...where, siteId };
                if (property === "examLocation" && query.siteId_code) {
                  query.code = query.siteId_code.code; delete query.siteId_code;
                }
                if (property === "enrollment" && query.siteId_studentId_academicYear_examRound_sourceType) {
                  Object.assign(query, query.siteId_studentId_academicYear_examRound_sourceType); delete query.siteId_studentId_academicYear_examRound_sourceType;
                }
                if (property === "enrollment" && query.siteId_barcode) {
                  query.barcode = query.siteId_barcode.barcode; delete query.siteId_barcode;
                }
                return query;
              };
              const beforeWhere: any = normalizeWhere(scopedArgs.where);
              const modelApi: any = modelTarget;
              let beforeRows: any[] = [];
              if (["upsert", "updateMany"].includes(operationName)) {
                beforeRows = await modelApi.findMany({ where: beforeWhere, take: 20_000 });
              } else if (operationName === "update") {
                const row = await modelApi.findFirst({ where: beforeWhere });
                if (row) beforeRows = [row];
              }

              const result = await operation.apply(modelTarget, [scopedArgs, ...args.slice(1)]);
              if (property === "importFile" && operationName === "create" && result?.id) {
                capture.activeImportFileId = result.id;
                return result;
              }

              const recordIds = operationName === "createManyAndReturn"
                ? (Array.isArray(result) ? result.map((row: any) => row.id).filter(Boolean) : [])
                : operationName === "updateMany"
                  ? beforeRows.map((row) => row.id)
                : (result as any)?.id ? [(result as any).id] : [];
              const afterRows = recordIds.length
                ? await modelApi.findMany({ where: { siteId, id: { in: recordIds } }, take: recordIds.length })
                : [];

              if (operationName === "updateMany") {
                capture.rows.push({ modelName: property, importFileId: capture.activeImportFileId, recordId: null, action: "BULK_UPDATE", beforeData: beforeRows, afterData: afterRows });
              } else {
                for (const id of recordIds) {
                  const before = beforeRows.find((row) => row.id === id) ?? null;
                  const after = afterRows.find((row) => row.id === id) ?? null;
                  capture.rows.push({ modelName: property, importFileId: capture.activeImportFileId, recordId: String(id), action: before ? "UPDATE" : "CREATE", beforeData: before, afterData: after });
                }
              }
              return result;
            };
          },
        });
      }
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
