import type { LogFormat } from '../types/log';
import { getLocalDate } from '../lib/date';

const sampleMoods = [
	'Cozy',
	'Sparkly',
	'Tired',
	'Cozy',
	'Sad',
	'Frustrated',
	'Sparkly',
];

export default function MonthPreview({
	entries,
	isGuest,
	moodColours,
	onViewCalendar,
}: {
	entries: LogFormat[];
	isGuest: boolean;
	moodColours: Record<string, { bg: string }>;
	onViewCalendar: () => void;
}) {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const today = getLocalDate(now);
	const days = new Date(year, month + 1, 0).getDate();
	const offset = (new Date(year, month, 1).getDay() + 6) % 7;
	const logs = new Map(entries.map((entry) => [entry.date, entry]));
	const savedDays = entries.filter((entry) =>
		entry.date.startsWith(today.slice(0, 7))
	).length;

	return (
		<section className="month-preview" aria-labelledby="month-preview-title">
			<div className="month-preview-heading">
				<h2 id="month-preview-title">Your month in pixels</h2>
				<button type="button" onClick={onViewCalendar}>
					View calendar <span aria-hidden="true">→</span>
				</button>
			</div>
			<div className="month-preview-body">
				<div className="month-preview-caption">
					<p>
						{now.toLocaleDateString('en-GB', {
							month: 'long',
							year: 'numeric',
						})}
					</p>
					{isGuest ? (
						<>
							<span className="month-preview-badge">Preview</span>
							<p className="small">Sample moods</p>
						</>
					) : (
						<p className="small" role="status">
							{savedDays
								? `${savedDays} ${savedDays === 1 ? 'day' : 'days'} saved`
								: 'Your first pixel starts here.'}
						</p>
					)}
				</div>
				<div
					className="month-preview-grid"
					role="list"
					aria-label={
						isGuest ? 'Sample month of moods' : 'Your moods this month'
					}
				>
					{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => (
						<span
							className="month-preview-weekday"
							key={`weekday-${index}`}
							aria-hidden="true"
						>
							{label}
						</span>
					))}
					{Array.from({ length: offset }, (_, index) => (
						<span key={`blank-${index}`} aria-hidden="true" />
					))}
					{Array.from({ length: days }, (_, index) => {
						const day = index + 1;
						const date = getLocalDate(new Date(year, month, day));
						const future = date > today;
						const mood = isGuest
							? !future && day % 6 !== 0
								? sampleMoods[index % sampleMoods.length]
								: undefined
							: logs.get(date)?.vibe;
						const label = `${date}: ${isGuest ? 'sample, ' : ''}${future ? 'Future day' : (mood ?? 'No check-in')}`;
						return (
							<span
								key={date}
								role="listitem"
								title={label}
								aria-label={label}
								className={`month-preview-pixel ${mood ? (moodColours[mood]?.bg ?? '') : ''}`}
								data-today={date === today}
								data-future={future}
							>
								<span aria-hidden="true">{day}</span>
							</span>
						);
					})}
				</div>
			</div>
		</section>
	);
}
