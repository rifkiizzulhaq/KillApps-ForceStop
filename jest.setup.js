import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

jest.mock("lucide-react-native", () => {
	return new Proxy(
		{},
		{
			get: (_target, prop) => {
				const MockIcon = () => null;
				MockIcon.displayName = prop;
				return MockIcon;
			},
		},
	);
});
