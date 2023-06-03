import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect } from "react";
import logo from "../../public/logo.png";

export default function Custom404() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Image src={logo} alt="" width={100} height="100"></Image>
    </div>
  );
}
