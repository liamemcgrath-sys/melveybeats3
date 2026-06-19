"use client";

import dynamic from "next/dynamic";

const HomeClient = dynamic(
  () => import("@/src/components/HomeClient"),
  { ssr: false }
);

export default HomeClient;
