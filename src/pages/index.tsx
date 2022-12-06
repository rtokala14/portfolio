import { type NextPage } from "next";
import About from "../components/about";
import { Body } from "../components/body";
import Contact from "../components/contact";
import Projects from "../components/projects";

const Home: NextPage = () => {
  return (
    <>
      <Body />
      <div className=" mb-14" id="about"></div>
      <About />
      <div className=" mb-14" id="projects"></div>
      <Projects />
      <div className=" mb-14" id="contact"></div>
      <Contact />
    </>
  );
};

export default Home;
