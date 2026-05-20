export function MaintenancePage({ message }: { message: string }) {
  return (
    <div className="gap-8 col-start-2 row-start-2 flex min-h-screen flex-col items-center justify-center">
      <h2 className="font-mono text-white text-xl bg-black p-1 px-4 rounded-sm -rotate-2">
        <span className="text-secondary dark:text-secondary-dark">BRB </span>
        <span className="text-gray-500">| </span>
        {message}
      </h2>
    </div>
  )
}
