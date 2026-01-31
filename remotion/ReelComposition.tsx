import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, Img, staticFile } from 'remotion';
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

// Load fonts
const { fontFamily: SANS_FONT } = loadInter();
const SERIF_FONT = "Georgia, serif";

// --- COLORS ---
const COLORS = {
    bg: '#FAF8F3', // Cream
    text: '#5C4033', // Deep Brown
    accent: '#C9A961', // Gold
};

// --- TYPEWRITER COMPONENT ---
const TypewriterText: React.FC<{
    text: string;
    startFrame: number;
    durationInFrames: number;
    style?: React.CSSProperties;
}> = ({ text, startFrame, durationInFrames, style }) => {
    const frame = useCurrentFrame();

    // Calculate progress 0 to 1
    const progress = interpolate(
        frame,
        [startFrame, startFrame + durationInFrames],
        [0, 1],
        { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
    );

    const charsToShow = Math.floor(progress * text.length);
    const currentText = text.substring(0, charsToShow);

    // Blinking cursor effect
    const showCursor = frame >= startFrame && frame < startFrame + durationInFrames + 30 && frame % 20 < 10;

    return (
        <div style={{ ...style, position: 'relative' }}>
            {currentText}
            {showCursor && <span style={{ color: COLORS.accent }}>|</span>}
        </div>
    );
};

export const ReelComposition: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const logoPath = staticFile("logo.png");

    const f = (t: number) => Math.round(t * fps);

    // --- TIMING ---
    // Frame 1: Hook (0-4s)
    const start1 = 0;
    const end1 = f(4);

    // Frame 2: Transition (4-7s)
    const start2 = end1;
    const end2 = start2 + f(3);

    // Frame 3: Verse (7-13s)
    const start3 = end2;
    const end3 = start3 + f(6);

    // Frame 4: Explanation (13-20s)
    const start4 = end3;
    const end4 = start4 + f(7);

    // Frame 5: CTA (20-24s)
    const start5 = end4;
    // End is total duration

    return (
        <AbsoluteFill style={{ backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>

            {/* PERSISTENT LOGO */}
            <div style={{ position: 'absolute', top: 120, opacity: 0.9 }}>
                <Img src={logoPath} style={{ width: 140 }} />
            </div>

            {/* --- FRAME 1: HOOK (0-4s) --- */}
            {frame >= start1 && frame < start2 && (
                <div style={{ width: '80%', textAlign: 'center' }}>
                    <TypewriterText
                        text="Ever wonder why you get angry for no reason?"
                        startFrame={start1 + 10}
                        durationInFrames={f(3)} // Type over 3s, hold 1s
                        style={{
                            fontFamily: SANS_FONT,
                            fontSize: 70,
                            fontWeight: 'bold',
                            color: COLORS.text,
                            lineHeight: 1.3
                        }}
                    />
                </div>
            )}

            {/* --- FRAME 2: TRANSITION (4-7s) --- */}
            {frame >= start2 && frame < start3 && (
                <div style={{ width: '80%', textAlign: 'center' }}>
                    <TypewriterText
                        text="Let's understand it."
                        startFrame={start2 + 10}
                        durationInFrames={f(2)}
                        style={{
                            fontFamily: SANS_FONT,
                            fontSize: 60,
                            color: COLORS.accent,
                            lineHeight: 1.3
                        }}
                    />
                </div>
            )}

            {/* --- FRAME 3: VERSE (7-13s) --- */}
            {/* Fade In instead of typewriter for verse as requested */}
            {frame >= start3 && frame < start4 && (
                <div style={{
                    opacity: interpolate(frame, [start3, start3 + 20], [0, 1]), // Fade in
                    width: '85%',
                    textAlign: 'center',
                    border: `2px solid ${COLORS.accent}`,
                    padding: 60
                }}>
                    <p style={{
                        fontFamily: SANS_FONT,
                        fontSize: 24,
                        color: COLORS.accent,
                        marginBottom: 30,
                        fontWeight: 'bold',
                        letterSpacing: 2
                    }}>
                        CHAPTER 2, VERSE 62
                    </p>
                    <p style={{
                        fontFamily: SERIF_FONT,
                        fontSize: 44,
                        fontStyle: 'italic',
                        color: COLORS.text,
                        lineHeight: 1.5
                    }}>
                        "Dwelling on sense objects gives rise to attachment. From attachment arises desire, and from desire arises anger."
                    </p>
                </div>
            )}

            {/* --- FRAME 4: EXPLANATION (13-20s) --- */}
            {frame >= start4 && frame < start5 && (
                <div style={{ width: '85%', textAlign: 'center' }}>
                    <TypewriterText
                        text="When you keep thinking about something, you become attached to it. That attachment turns into a strong desire to have it. When you can't get what you desire, frustration and anger arise."
                        startFrame={start4 + 10}
                        durationInFrames={f(6)} // Type most of the time
                        style={{
                            fontFamily: SANS_FONT,
                            fontSize: 42,
                            color: COLORS.text,
                            lineHeight: 1.5
                        }}
                    />
                </div>
            )}

            {/* --- FRAME 5: CTA (20-End) --- */}
            {frame >= start5 && (
                <div style={{ opacity: interpolate(frame, [start5, start5 + 20], [0, 1]), width: '80%', textAlign: 'center' }}>
                    <p style={{
                        fontFamily: SANS_FONT,
                        fontSize: 50,
                        color: COLORS.text,
                        fontWeight: 'bold'
                    }}>
                        Follow @gitalens
                    </p>
                    <p style={{
                        fontFamily: SERIF_FONT,
                        fontSize: 30,
                        color: COLORS.accent,
                        marginTop: 20
                    }}>
                        Daily Gita Wisdom
                    </p>
                </div>
            )}

        </AbsoluteFill>
    );
};
