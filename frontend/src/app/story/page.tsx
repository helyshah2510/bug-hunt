
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

const scenes = [
    {
        image: '/scene1.png',
        eyebrow: 'CHAPTER 01 · THE BEGINNING',
        title: 'Every Mystery Starts Somewhere.',
        text: 'You have joined the Investigation Bureau. Tonight, a mysterious case lands on your desk.',
    },
    {
        image: '/scene2.png',
        eyebrow: 'CHAPTER 02 · THE MYSTERY',
        title: 'Something Is Breaking the Code.',
        text: 'Programs are behaving strangely. Follow the clues, test your theories, and uncover the bugs.',
    },
    {
        image: '/scene3.png',
        eyebrow: 'YOUR MISSION',
        title: 'You Are a Bug Hunter.',
        text: 'Fix Python bugs, earn XP, and unlock tougher cases. Every investigation makes you a sharper programmer.',
    },
];

export default function StoryPage() {
    const [sceneIndex, setSceneIndex] = useState(0);
    const [showContent, setShowContent] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const contentTimer = window.setTimeout(() => {
            setShowContent(true);
        }, 250);

        if (sceneIndex === 2) {
            return () => window.clearTimeout(contentTimer);
        }

        const sceneTimer = window.setTimeout(() => {
            setShowContent(false);
            setSceneIndex((current) => current + 1);
        }, sceneIndex === 0 ? 3000 : 4000);

        return () => {
            window.clearTimeout(contentTimer);
            window.clearTimeout(sceneTimer);
        };
    }, [sceneIndex]);

    const scene = scenes[sceneIndex];

    return (
        <main className="story-screen">
            <div className="story-dust" aria-hidden="true">
                {Array.from({ length: 45 }, (_, i) => (
                    <span
                        key={i}
                        style={{
                            left: `${(i * 37 + 11) % 100}%`,
                            top: `${(i * 53 + 7) % 100}%`,
                            animationDelay: `${(i % 8) * 0.5}s`,
                        }}
                    />
                ))}
            </div>

            <section className="story-stage" aria-live="polite">
                <div className="story-image-wrap" key={scene.image}>
                    <img
                        src={scene.image}
                        alt=""
                        className="story-image"
                    />
                </div>

                <div
                    className={`story-content ${showContent ? 'is-visible' : ''}`}
                >
                    <p className="story-eyebrow">{scene.eyebrow}</p>

                    <h1>{scene.title}</h1>

                    <p className="story-description">{scene.text}</p>

                    {sceneIndex === 2 && (
                        <button
                            type="button"
                            className="story-start-button"
                            onClick={() => router.push('/challenges')}
                        >
                            Start Investigating
                            <ArrowRight size={19} />
                        </button>
                    )}
                </div>

                <div className="story-progress" aria-label={`Scene ${sceneIndex + 1} of 3`}>
                    {scenes.map((item, index) => (
                        <span
                            key={item.image}
                            className={index <= sceneIndex ? 'active' : ''}
                        />
                    ))}
                </div>
            </section>
        </main>
    );
}
