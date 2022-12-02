import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export function Header() {
  const router = useRouter();
  const currentRoute = router.pathname;

  return (
    <>
      <Head>
        <title>Rohit Tokala</title>
        <meta name="description" content="Personal portfolio of Rohit Tokala" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header className=" sticky top-0 z-50 mb-5 flex flex-row items-center justify-between rounded-3xl border border-primary bg-shadow p-3">
        <Link href={"/"} className=" font-expletus text-2xl font-bold">
          Rohit Tokala
        </Link>
        <ul className=" flex flex-row items-center gap-3 text-primary">
          <li>
            <Link
              className={` rounded-xl p-2 text-lg hover:font-medium `}
              href="#home"
              scroll={false}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              className={` rounded-xl p-2 text-lg hover:font-medium`}
              href="#about"
              scroll={false}
            >
              About
            </Link>
          </li>
          <li>
            <Link
              className={` rounded-xl p-2 text-lg hover:font-medium`}
              href={"#projects"}
              scroll={false}
            >
              Projects
            </Link>
          </li>
          {/* <li>
            <Link
              className={` rounded-xl p-2 hover:bg-shadow  ${
                currentRoute === "/resume" ? `border bg-shadow font-medium` : ""
              }`}
              href={"/resume"}
            >
              Resume
            </Link>
          </li> */}
        </ul>
        <ul className=" flex flex-row items-center gap-3 text-primary">
          <li>
            <Link
              className={` rounded-xl border border-primary bg-primary p-2 text-white hover:bg-shadow hover:text-primary `}
              href={"#contact"}
              scroll={false}
            >
              Contact Me
            </Link>
          </li>
        </ul>
      </header>
    </>
  );
}

// ${
//   currentRoute === "/" || currentRoute === "/#home"
//     ? `border bg-shadow font-medium`
//     : ""
// }
