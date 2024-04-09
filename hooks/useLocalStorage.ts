import { useState } from 'react';

const useLocalStorage = <T>(
	key: string,
	initialValue: T
): [T, (value: T | ((value: T) => T)) => void] => {
	const [storedValue, setStoredValue] = useState(() => {
		try {
			const item = localStorage.getItem(key);
			return item ? (JSON.parse(item) as T) : initialValue;
		} catch (error) {
			return initialValue;
		}
	});

	const setValue = (value: T | ((value: T) => T)) => {
		try {
			const newValue =
				value instanceof Function ? (value as (value: T) => T)(storedValue) : value;
			setStoredValue(newValue);
			localStorage.setItem(key, JSON.stringify(newValue));
		} catch (error) {}
	};

	return [storedValue, setValue];
};

export default useLocalStorage;
