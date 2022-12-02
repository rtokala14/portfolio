export default function About() {
  return (
    <div id="about" className=" h-fit p-5">
      {/* <!-- component --> */}
      <div className=" container mx-auto h-full w-full">
        <div className="wrap relative h-full overflow-hidden p-10">
          <div className=" absolute left-2/4 h-full border border-primary border-opacity-60"></div>
          {/* <!-- right timeline --> */}
          <div className="right-timeline mb-8 flex w-full items-center justify-between">
            <div className="order-1 w-5/12"></div>
            <div className="z-20 order-1 flex h-8 w-fit items-center rounded-2xl bg-gray-800 p-2 shadow-xl">
              <h1 className="mx-auto text-lg font-semibold text-white">2022</h1>
            </div>
            <div className="order-1 w-5/12 rounded-lg bg-shadow px-6 py-4 shadow-xl">
              <h3 className="mb-3 text-xl font-bold text-primary">
                Lorem Ipsum
              </h3>
              <p className="text-sm leading-snug tracking-wide text-primary text-opacity-100">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum has been the industry's standard dummy
                text ever since the 1500s, when an unknown printer took a galley
                of type and scrambled it to make a type specimen book.
              </p>
            </div>
          </div>

          {/* <!-- left timeline --> */}
          <div className="left-timeline mb-8 flex w-full flex-row-reverse items-center justify-between">
            <div className="order-1 w-5/12"></div>
            <div className="z-20 order-1 flex h-8 w-fit items-center rounded-2xl bg-gray-800 p-2 shadow-xl">
              <h1 className="mx-auto text-lg font-semibold text-white">2021</h1>
            </div>
            <div className="order-1 w-5/12 rounded-lg bg-secondary_bg px-6 py-4 shadow-xl">
              <h3 className="mb-3 text-xl font-bold text-white">Lorem Ipsum</h3>
              <p className="text-sm font-medium leading-snug tracking-wide text-white text-opacity-100">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum has been the industry's standard dummy
                text ever since the 1500s, when an unknown printer took a galley
                of type and scrambled it to make a type specimen book.
              </p>
            </div>
          </div>

          {/* <!-- right timeline --> */}
          <div className="right-timeline mb-8 flex w-full items-center justify-between">
            <div className="order-1 w-5/12"></div>
            <div className="z-20 order-1 flex h-8 w-fit items-center rounded-2xl bg-gray-800 p-2 shadow-xl">
              <h1 className="mx-auto text-lg font-semibold text-white">2021</h1>
            </div>
            <div className="order-1 w-5/12 rounded-lg bg-shadow px-6 py-4 shadow-xl">
              <h3 className="mb-3 text-xl font-bold text-primary">
                Lorem Ipsum
              </h3>
              <p className="text-sm leading-snug tracking-wide text-primary text-opacity-100">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum has been the industry's standard dummy
                text ever since the 1500s, when an unknown printer took a galley
                of type and scrambled it to make a type specimen book.
              </p>
            </div>
          </div>

          {/* <!-- left timeline --> */}
          <div className="left-timeline mb-8 flex w-full flex-row-reverse items-center justify-between">
            <div className="order-1 w-5/12"></div>
            <div className="z-20 order-1 flex h-8 w-fit items-center rounded-2xl bg-gray-800 p-2 shadow-xl">
              <h1 className="mx-auto text-lg font-semibold text-white">2020</h1>
            </div>
            <div className="order-1 w-5/12 rounded-lg bg-secondary_bg px-6 py-4 shadow-xl">
              <h3 className="mb-3 text-xl font-bold text-white">Lorem Ipsum</h3>
              <p className="text-sm font-medium leading-snug tracking-wide text-white text-opacity-100">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum has been the industry's standard dummy
                text ever since the 1500s, when an unknown printer took a galley
                of type and scrambled it to make a type specimen book.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
