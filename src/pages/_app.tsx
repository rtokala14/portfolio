import { type AppType } from "next/dist/shared/lib/utils";
import { Footer } from "../components/footer";
import { Header } from "../components/header";

import "../styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Header />
      <Component {...pageProps} />
      <Footer />
    </>
  );
};

export default MyApp;
