import * as React from "react";
import { motion } from "motion/react";

type LoadingTextProps = {
	messages: string[];
	isActive: boolean;
	className?: string;
	staggerMs?: number;
	holdMs?: number;
	cooldownMs?: number;
};

export const LoadingText: React.FC<LoadingTextProps> = ({
	messages,
	isActive,
	className = "",
	staggerMs = 50,
	holdMs = 800,
	cooldownMs = 200,
}) => {
	const [index, setIndex] = React.useState(0);

	React.useEffect(() => {
		if (!isActive) {
			setIndex(0);
			return;
		}

		const message = messages[index] ?? "";
		const totalMs = message.length * staggerMs + holdMs + cooldownMs;
		const timeoutId = window.setTimeout(() => {
			setIndex((prev) => (prev + 1) % messages.length);
		}, totalMs);

		return () => window.clearTimeout(timeoutId);
	}, [cooldownMs, holdMs, index, isActive, messages, staggerMs]);

	const message = messages[index] ?? "";
	const letters = message.split("");
	const delayStep = staggerMs / 1000;

	const letterVariants = {
		hidden: { opacity: 0, y: 4 },
		show: (i: number) => ({
			opacity: 1,
			y: 0,
			transition: { delay: i * delayStep },
		}),
	};

	return (
		<motion.span
			key={`${index}-${message}`}
			initial="hidden"
			animate="show"
			className={`whitespace-pre ${className}`}
		>
			{letters.map((letter, i) => (
				<motion.span key={`${letter}-${i}`} variants={letterVariants} custom={i}>
					{letter}
				</motion.span>
			))}
		</motion.span>
	);
};
