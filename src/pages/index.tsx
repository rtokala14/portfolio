import { type NextPage } from "next";
import About from "../components/about";
import { Body } from "../components/body";
import Contact from "../components/contact";
import Projects from "../components/projects";

const Home: NextPage = () => {
  return (
    <>
      <Body />
      <About />
      <Projects />
      <Contact />
    </>
  );
};

export default Home;
