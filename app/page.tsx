export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">{{project_name}}</h1>
      <p className="text-muted-foreground text-lg">
        Welcome to your new project
      </p>
    </div>
  );
}
