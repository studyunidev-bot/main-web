"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

type PdfDocument = import("pdfjs-dist").PDFDocumentProxy;

export default function PurchasedExamPdfViewer({
  src,
  title,
}: {
  src: string;
  title: string;
}) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PdfDocument | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewerWidth, setViewerWidth] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: {
      promise: Promise<PdfDocument>;
      destroy: () => Promise<void>;
    } | undefined;

    setPdf(null);
    setPageCount(0);
    setCurrentPage(1);
    setError(false);

    void import("pdfjs-dist/build/pdf.mjs")
      .then((pdfjs) => {
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        const task = pdfjs.getDocument(src);
        loadingTask = task;
        return task.promise;
      })
      .then((document) => {
        if (!document || cancelled) return;
        setPdf(document);
        setPageCount(document.numPages);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      void loadingTask?.destroy();
    };
  }, [src]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setViewerWidth(entry.contentRect.width);
    });
    resizeObserver.observe(viewer);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!pdf || !viewerWidth || !pagesRef.current) return;
    let cancelled = false;
    const renderTasks: Array<{ cancel: () => void }> = [];
    const canvases = Array.from(
      pagesRef.current.querySelectorAll<HTMLCanvasElement>("canvas"),
    );

    const renderPages = async () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      for (let index = 0; index < pageCount; index += 1) {
        if (cancelled) return;
        const page = await pdf.getPage(index + 1);
        if (cancelled) return;

        const canvas = canvases[index];
        const context = canvas?.getContext("2d", { alpha: false });
        if (!canvas || !context) continue;

        const originalViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({
          scale: Math.max(0.1, (viewerWidth - 24) / originalViewport.width),
        });
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const task = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        });
        renderTasks.push(task);
        try {
          await task.promise;
        } catch {
          if (!cancelled) setError(true);
          return;
        }
      }
    };

    void renderPages().catch(() => {
      if (!cancelled) setError(true);
    });

    return () => {
      cancelled = true;
      renderTasks.forEach((task) => task.cancel());
    };
  }, [pdf, pageCount, viewerWidth]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const pages = pagesRef.current;
    if (!viewer || !pages || !pageCount) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visiblePages = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const page = visiblePages[0]?.target.getAttribute("data-page");
        if (page) setCurrentPage(Number(page));
      },
      { root: viewer, threshold: [0.25, 0.6, 0.9] },
    );

    pages.querySelectorAll<HTMLElement>("[data-page]").forEach((page) => {
      observer.observe(page);
    });
    return () => observer.disconnect();
  }, [pageCount]);

  const goToPage = useCallback((page: number) => {
    pagesRef.current
      ?.querySelector<HTMLElement>(`[data-page="${page}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <section className="wb-pdf-viewer wb-purchased-pdf-viewer" aria-label={title}>
      <div className="wb-pdf-toolbar">
        <span className="wb-pdf-page-count" aria-live="polite">
          {pageCount ? `${currentPage} / ${pageCount}` : "กำลังเปิดเอกสาร"}
        </span>
        <div className="wb-pdf-toolbar-spacer" />
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={!pageCount || currentPage <= 1}
          aria-label="หน้าก่อนหน้า"
        >
          <LuChevronUp aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={!pageCount || currentPage >= pageCount}
          aria-label="หน้าถัดไป"
        >
          <LuChevronDown aria-hidden="true" />
        </button>
      </div>
      <div className="wb-purchased-pdf-scroll" ref={viewerRef}>
        {error ? (
          <p className="wb-purchased-pdf-message" role="alert">
            เปิดเอกสารไม่สำเร็จ กรุณาลองโหลดหน้านี้อีกครั้ง
          </p>
        ) : !pdf ? (
          <p className="wb-purchased-pdf-message" role="status">
            กำลังโหลดเอกสาร…
          </p>
        ) : (
          <div className="wb-purchased-pdf-pages" ref={pagesRef}>
            {Array.from({ length: pageCount }, (_, index) => (
              <div
                className="wb-purchased-pdf-page"
                data-page={index + 1}
                key={`${src}-${index + 1}`}
              >
                <canvas aria-label={`${title} หน้า ${index + 1}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
