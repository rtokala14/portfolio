import Image, { StaticImageData } from "next/image";

type ProjectCardProps = {
  image: StaticImageData;
  gitLink: string;
  preview: string;
  title: string;
  blurb: string;
  tags: string[];
};

export default function ProjectCard({
  image,
  gitLink,
  preview,
  title,
  blurb,
  tags,
}: ProjectCardProps) {
  return (
    <div className=" max-w-xl place-self-center overflow-hidden rounded-2xl bg-shadow shadow-md md:gap-14 ">
      <Image
        src={image}
        alt="Preview of the project"
        placeholder="blur"
        style={{
          objectFit: "cover",
        }}
      />
      <div className=" p-4">
        <h2 className=" text-2xl font-medium">{title}</h2>
        <div className=" flex gap-2 pt-1">
          {tags.map((tag) => (
            <text
              className=" rounded-md border border-black p-1 text-xs"
              key={tag}
            >
              {tag}
            </text>
          ))}
        </div>
        <div className=" pt-2 font-light">{blurb}</div>
        <div className=" flex justify-evenly pt-2">
          <a
            target={"_blank"}
            className=" rounded-xl border-2 border-secondary_bg bg-secondary_bg p-2 text-white hover:bg-white hover:text-secondary_bg"
            href={gitLink}
          >
            Source Code
          </a>
          <a
            target={"_blank"}
            className=" rounded-xl border-2 border-black bg-primary p-2 text-white hover:bg-inherit hover:text-black"
            href={preview}
          >
            Live Preview
          </a>
        </div>
      </div>
    </div>
  );
}
