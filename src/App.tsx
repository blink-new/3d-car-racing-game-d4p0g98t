import { Suspense } from 'react';
import { RacingGame } from './components/RacingGame';

function App() {
  return (
    <div className="w-full h-full">
      <Suspense fallback={<Loading />}>
        <RacingGame />
      </Suspense>
    </div>
  );
}

function Loading() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Loading Racing Game...</h1>
        <p>Get ready to race!</p>
      </div>
    </div>
  );
}

export default App;