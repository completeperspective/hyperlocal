/* eslint-disable @next/next/no-img-element */
export const Post = ({
  title,
  description,
  publishedAt,
  author,
  image,
  altText,
}: {
  title: string;
  description: string;
  publishedAt: string;
  author: string;
  image?: string;
  altText?: string;
}) => {
  console.log("Post", { title, description, publishedAt, author, image, altText });
  return (
    <article className="dark:bg-surface-dark bg-surface max-w-[640px]">
      <div className="flex items-center px-4 py-3">
        <img
          className="cursor-pointer rounded-full h-8 outline outline-primary dark:outline-primary-dark outline-offset-1 mr-3"
          src="/avatar.png"
          alt={`author-image`}
        />
        <div className="flex-1 flex-col">
          <p className="font-bold">{author}</p>
          <p className="text-gray-400 text-xs">{publishedAt}</p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
          />
        </svg>
      </div>

      {image ? (
        <img
          className="w-full object-cover bg-dark dark:bg-black max-h-[1280px]"
          src={image}
          alt={altText || `${title}-image`}
          width={640}
          height="auto"
        />
      ) : (
        <div className="w-full object-cover bg-dark dark:bg-black max-h-[1280px]"></div>
      )}

      <div className="flex justify-between p-4">
        <div className="flex space-x-4 h-[24px] w-full text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="btn hover:text-primary dark:hover:text-primary-dark cursor-pointer"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="btn hover:text-primary dark:hover:text-primary-dark cursor-pointer"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="btn rotate-45 h-6 hover:text-primary dark:hover:text-primary-dark cursor-pointer"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="btn hover:text-primary dark:hover:text-primary-dark cursor-pointer"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
      </div>
      <p className="px-5 pb-5 mb-6 truncate whitespace-pre-wrap">
        {/* <span className="text-sm text-primary font-bold">2 likes</span>
        <br /> */}
        <span className="font-bold mr-2">{author}</span>
        {description}
      </p>

      {/* <div className="mx-10 max-h-24 overflow-y-scroll scrollbar-none">
        <div className="flex items-center space-x-2 mb-2">
          <img className="h-7 rounded-full object-cover" src="https://i.pravatar.cc/150?img=1" alt="user-image" />
          <p className="font-semibold">RyanwatQueem</p>
          <p className="flex-1 truncate">nice</p>
          <p>2 hours ago</p>
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <img className="h-7 rounded-full object-cover" src="https://i.pravatar.cc/150?img=2" alt="user-image" />
          <p className="font-semibold">Vicenary</p>
          <p className="flex-1 truncate">amazing!</p>
          <p>5 hours ago</p>
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <img className="h-7 rounded-full object-cover" src="https://i.pravatar.cc/150?img=3" alt="user-image" />
          <p className="font-semibold">Stibialism</p>
          <p className="flex-1 truncate">great!</p>
          <p>2 days ago</p>
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <img className="h-7 rounded-full object-cover" src="https://i.pravatar.cc/150?img=4" alt="user-image" />
          <p className="font-semibold">Ubiquarian</p>
          <p className="flex-1 truncate">nice pic!</p>
          <p>1 month ago</p>
        </div>
      </div> */}

      {/* <form className="flex items-center p-4 py-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7 mr-4 hover:text-primary dark:hover:text-primary-dark"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <input
          type="text"
          placeholder="Enter your comment..."
          className="w-full bg-transparent pl-2 pr-4 font-medium focus:outline-none"
        />
        <button className="hover:opacity-75 dark:text-primary-dark font-bold text-primary px-4">Post</button>
      </form> */}
    </article>
  );
};
