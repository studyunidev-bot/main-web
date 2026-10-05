"use client";

import { ChevronUpIcon } from "@/assets/icons";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn, handleLogout } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import { LogOutIcon, SettingsIcon, UserIcon } from "./icons";
import { useSession } from "next-auth/react";

export function UserInfo({ displayName }: { displayName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();


  const USER = {
    name: displayName || session?.user.name || "จัดการบัญชี",
    email: session?.user.email || session?.user.id || "",
    img: "/images/site/home/logo.png",
  };

  // const handleLogout = async () => {
  //   try {
  //     const user_id = session?.user.id
  //     if (!user_id) {
  //       console.warn("User not logged in");
  //       return;
  //     }
  //     const res = await api.post(`/auth/${process.env.NEXT_PUBLIC_V}/logout`, { user_id })
  //     console.log({ res });
  //     if (res.status === 200) {
  //       signOut({ callbackUrl: '/auth/sign-in' })
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     const message = handleAxiosError(error);
  //     throw new Error(message);
  //   }
  // }

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">My Account</span>

        <figure className="flex items-center gap-3 ">
          {/* <Image
            src={USER.img}
            className="size-12 bg-dark-2  rounded-full"
            alt={`Avatar of ${USER.name}`}
            role="presentation"
            width={200}
            height={200}
          /> */}
          <figcaption className="flex items-center gap-1 font-medium text-dark dark:text-dark-6 max-[1024px]:sr-only">
            <span>{USER.name}</span>

            <ChevronUpIcon
              aria-hidden
              className={cn(
                "rotate-180 transition-transform",
                isOpen && "rotate-0",
              )}
              strokeWidth={1.5}
            />
          </figcaption>
        </figure>
      </DropdownTrigger>

      <DropdownContent
        className="border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-[230px]:min-w-[17.5rem]"
        align="end"
      >
        <h2 className="sr-only">User information</h2>

        <figure className="flex items-center gap-2.5 px-5 py-3.5">
          <Image
            src={USER.img}
            className="size-10 bg-dark-2 rounded-full"
            alt={`Avatar for ${USER.name}`}
            role="presentation"
            width={200}
            height={200}
          />

          <figcaption className=" text-base font-medium">
            <div className=" leading-none text-dark dark:text-white">
              {USER.name}
            </div>
            {/* <div className="leading-none text-gray-6">{USER.email}</div> */}
          </figcaption>
        </figure>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />
        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6">

          <button
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
            onClick={() => {
              handleLogout()
            }}
          >
            <LogOutIcon />

            <span className="text-base font-medium">ออกจากระบบ </span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
