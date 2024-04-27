export const getCssVarVal = (variable: string, isHsl = true) => {
	if (isHsl) {
		return `hsl(${getComputedStyle(document.body).getPropertyValue(variable)})`;
	}

	return `${getComputedStyle(document.body).getPropertyValue(variable)}`;
};
