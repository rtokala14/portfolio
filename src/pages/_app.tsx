import { type AppType } from "next/dist/shared/lib/utils";
import { Footer } from "../components/footer";
import { Header } from "../components/header";
import { Patua_One, Expletus_Sans } from "@next/font/google";

import "../styles/globals.css";

const patua = Patua_One({
  subsets: ["latin"],
  weight: "400",
});

const expletus = Expletus_Sans({
  weight: "variable",
  style: "normal",
  subsets: ["latin"],
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <style jsx global>
        {`
          :root {
            --patua-one-font: ${patua.style.fontFamily};
            --expletus-font: ${expletus.style.fontFamily};
          }
        `}
      </style>
      <Header />
      <Component {...pageProps} />
      <Footer />
    </>
  );
};

export default MyApp;
