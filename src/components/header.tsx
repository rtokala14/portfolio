import Link from "next/link";
import { useRouter } from "next/router";

export function Header() {
  const router = useRouter();
  const currentRoute = router.pathname;

  return (
    <div className=" flex flex-row items-center justify-between">
      <text>Rohit Tokala</text>
      <ul className=" flex flex-row items-center gap-3 text-primary">
        <li>
          <Link
            className={` rounded-xl p-2 hover:bg-shadow  ${
              currentRoute === "/" ? `border bg-shadow font-medium` : ""
            }`}
            href="/"
          >
            Home
          </Link>
        </li>
        <li>
          <Link
            className={` rounded-xl p-2 hover:bg-shadow ${
              currentRoute === "/about" ? `border bg-shadow font-medium` : ""
            }`}
            href="/about"
          >
            About
          </Link>
        </li>
        <li>
          <Link
            className={` rounded-xl p-2 hover:bg-shadow ${
              currentRoute === "/projects" ? `border bg-shadow font-medium` : ""
            }`}
            href={"/projects"}
          >
            Projects
          </Link>
        </li>
        <li>
          <Link
            className={` rounded-xl p-2 hover:bg-shadow  ${
              currentRoute === "/resume" ? `border bg-shadow font-medium` : ""
            }`}
            href={"/resume"}
          >
            Resume
          </Link>
        </li>
        <li>
          <Link
            className={` rounded-xl border border-primary bg-primary p-2 hover:bg-shadow hover:text-primary ${
              currentRoute === "/contact"
                ? "border bg-shadow font-medium text-primary"
                : "text-white"
            }`}
            href={"/contact"}
          >
            Contact Me
          </Link>
        </li>
      </ul>
    </div>
  );
}
