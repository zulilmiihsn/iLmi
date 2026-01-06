'use client';

import { useState, useRef, useEffect } from 'react';

export default function Terminal() {
	const [commandHistory, setCommandHistory] = useState<string[]>([]);
	const [currentCommand, setCurrentCommand] = useState('');
	const [output, setOutput] = useState<string[]>(['Welcome to Terminal. Type "help" for commands.']);
	const inputRef = useRef<HTMLInputElement>(null);

	function executeCommand(cmd: string) {
		const [command, ...args] = cmd.trim().split(' ');

		switch (command.toLowerCase()) {
			case 'help':
				setOutput((prev) => [...prev, 'Available commands: ls, cd, pwd, clear, echo']);
				break;
			case 'ls':
				setOutput((prev) => [...prev, 'Documents  Desktop  Downloads']);
				break;
			case 'pwd':
				setOutput((prev) => [...prev, '/Users/user']);
				break;
			case 'clear':
				setOutput([]);
				break;
			case 'echo':
				setOutput((prev) => [...prev, args.join(' ')]);
				break;
			case '':
				break;
			default:
				setOutput((prev) => [...prev, `Command not found: ${command}`]);
		}

		setCommandHistory([...commandHistory, cmd]);
		setCurrentCommand('');
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === 'Enter') {
			executeCommand(currentCommand);
		}
	}

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	return (
		<div className="terminal w-full h-full bg-black text-ios-green font-mono p-4 flex flex-col" style={{ paddingTop: 'max(env(safe-area-inset-top), 44px)' }}>
			<div className="output flex-1 overflow-y-auto mb-2">
				{output.map((line, index) => (
					<div key={index}>{line}</div>
				))}
			</div>
			<div className="input flex items-center">
				<span className="mr-2">$</span>
				<input
					ref={inputRef}
					type="text"
					className="flex-1 bg-transparent border-none outline-none text-ios-green"
					value={currentCommand}
					onChange={(e) => setCurrentCommand(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Type a command..."
				/>
			</div>
		</div>
	);
}

