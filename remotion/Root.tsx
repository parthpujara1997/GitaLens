import React from 'react';
import { Composition } from 'remotion';
import { ReelComposition } from './ReelComposition';
// @ts-ignore
import { GITA_VERSES } from '../gitaData';

export const RemotionRoot: React.FC = () => {
    // Default to the first verse if no logical ID is passed, or just a sample
    const sampleVerse = GITA_VERSES[0];

    return (
        <>
            <Composition
                id="ReelComposition"
                component={ReelComposition}
                durationInFrames={720} // 24 seconds at 30fps
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    verseId: "2-62",
                }}
            />
        </>
    );
};
