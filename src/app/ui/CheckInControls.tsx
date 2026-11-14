import MoodFace from "./MoodFace";

export function MoodPicker({ moods, value, onChange }: {
    moods: string[];
    value: string | null;
    onChange: (mood: string) => void;
}) {
    return (
        <div className="moods">
            {moods.map((name) => (
                <button type="button" className="mood" key={name}
                    aria-pressed={value === name} onClick={() => onChange(name)}>
                    <span className="face-wrap">
                        <MoodFace mood={name} />
                        {value === name && <span className="mood-check" aria-hidden="true">✓</span>}
                    </span>
                    {name}
                </button>
            ))}
        </div>
    );
}

export function EnergyPicker({ value, onChange }: {
    value: number;
    onChange: (energy: number) => void;
}) {
    return (
        <fieldset className="energy">
            <legend>Your energy</legend>
            <div className="levels">
                {[1, 2, 3, 4, 5].map((level) => (
                    <button type="button" key={level}
                        aria-label={`Energy ${level} out of 5`}
                        aria-pressed={value === level} onClick={() => onChange(level)}>
                        {level}
                    </button>
                ))}
            </div>
            <div className="ends"><span>Low</span><span>High</span></div>
        </fieldset>
    );
}
