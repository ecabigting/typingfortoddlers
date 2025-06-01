import EmojiNavigator from "@/components/emojiNavigator";
import gameObjectsData from "../game-object.json"

type GameObject = {
  id: number;
  objectName: string;
  emoji: string;
};

export const dynamic = 'force-dynamic';

function shuffleArray<T>(array: T[]): T[] {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}

export default function Home() {
  const allGameObjects: GameObject[] = gameObjectsData as GameObject[];
  const filteredGameObjects = allGameObjects.filter(obj => {
    // return obj.objectName.length <= 5;
    return !obj.emoji.includes(" - ")
  });

  const shuffledGameObjects = shuffleArray(filteredGameObjects);
  // const shuffledGameObjects = shuffleArray(allGameObjects)
  console.log(shuffledGameObjects)
  console.log(shuffledGameObjects.length)
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      {shuffledGameObjects.length > 0 ? (
        <EmojiNavigator initialObjects={shuffledGameObjects} />
      ) : (
        <p className="text-xl">No game objects found or data is not in the expected format.</p>
      )}
    </main>)
}
