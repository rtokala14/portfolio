import ProjectCard from "./projectCard";
import hangmanPic from "../../public/hangman.png";

export default function Projects() {
  return (
    <div>
      <div className=" p-4">
        <h1 className=" text-5xl font-medium">Projects</h1>
        <div className=" h-full items-center justify-center gap-5 p-8 sm:flex sm:flex-col sm:gap-5 md:grid md:grid-cols-2 2xl:pl-64 2xl:pr-64">
          <ProjectCard
            image={hangmanPic}
            title="Test One"
            blurb="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s,"
            gitLink="https://github.com/rtokala14/hangman-ts"
            preview="https://hangman-ts.vercel.app/"
            tags={["NextJS", "TypeScript", "TailwindCSS"]}
          />
          <ProjectCard
            image={hangmanPic}
            title="Test One"
            blurb="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s,"
            gitLink="https://github.com/rtokala14/hangman-ts"
            preview="https://hangman-ts.vercel.app/"
            tags={["NextJS", "TypeScript", "TailwindCSS"]}
          />
          <ProjectCard
            image={hangmanPic}
            title="Test One"
            blurb="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s,"
            gitLink="https://github.com/rtokala14/hangman-ts"
            preview="https://hangman-ts.vercel.app/"
            tags={["NextJS", "TypeScript", "TailwindCSS"]}
          />
          <ProjectCard
            image={hangmanPic}
            title="Test One"
            blurb="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s,"
            gitLink="https://github.com/rtokala14/hangman-ts"
            preview="https://hangman-ts.vercel.app/"
            tags={["NextJS", "TypeScript", "TailwindCSS"]}
          />
        </div>
      </div>
    </div>
  );
}
