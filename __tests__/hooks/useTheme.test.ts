// @ts-nocheck
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useTheme } from "../../src/hooks/useTheme";

let mockThemeMode = "system";
let mockRNColorScheme = "light";

jest.mock("react-native", () => ({
	useColorScheme: () => mockRNColorScheme,
}));

jest.mock("../../src/stores/useAppStore", () => ({
	useAppStore: (selector: any) =>
		selector({ settings: { themeMode: mockThemeMode } }),
}));

describe("useTheme", () => {
	beforeEach(() => {
		mockThemeMode = "system";
		mockRNColorScheme = "light";
	});

	it("returns system light theme correctly when system is light", () => {
		mockThemeMode = "system";
		mockRNColorScheme = "light";
		const { isDark, colors } = useTheme();
		expect(isDark).toBe(false);
		expect(colors.bgClass).toBe("bg-white");
	});

	it("returns system dark theme correctly when system is dark", () => {
		mockThemeMode = "system";
		mockRNColorScheme = "dark";
		const { isDark, colors } = useTheme();
		expect(isDark).toBe(true);
		expect(colors.bgClass).toBe("bg-black");
	});

	it("returns explicit light theme correctly", () => {
		mockThemeMode = "light";
		mockRNColorScheme = "dark";
		const { isDark, colors } = useTheme();
		expect(isDark).toBe(false);
		expect(colors.bgClass).toBe("bg-white");
	});

	it("returns explicit dark theme correctly", () => {
		mockThemeMode = "dark";
		mockRNColorScheme = "light";
		const { isDark, colors } = useTheme();
		expect(isDark).toBe(true);
		expect(colors.bgClass).toBe("bg-black");
	});
});
