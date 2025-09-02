# Naming Suggestor

AI-powered variable and function naming suggestions using OpenAI to help you write cleaner, more readable code.

## Features

- **AI-Powered Suggestions**: Uses OpenAI's GPT models to analyze your code and suggest better names
- **Easy to Use**: Simply select code and press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
- **Multiple Suggestions**: Get multiple naming options with explanations
- **Smart Context Analysis**: Considers your code's context and purpose
- **Multiple Model Support**: Choose between GPT-3.5 Turbo, GPT-4, or GPT-4 Turbo

## Installation

1. Install the extension from the VS Code marketplace
2. Get an OpenAI API key from [OpenAI's website](https://platform.openai.com/api-keys)
3. Configure your API key in VS Code settings

## Setup

1. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "Naming Suggestor"
3. Enter your OpenAI API key in the "Openai Api Key" field
4. Optionally, choose your preferred model (GPT-3.5 Turbo, GPT-4, or GPT-4 Turbo)

## Usage

1. **Select Code**: Highlight variables, functions, or code blocks that you want to improve
2. **Get Suggestions**: Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
3. **Choose Improvements**: Select from the suggested naming improvements
4. **Apply Changes**: The extension will automatically rename all occurrences in your file

### Example

**Before:**

```javascript
const d = new Date();
const u = users.filter((x) => x.active);
function calc(a, b) {
  return a * b * 0.1;
}
```

**After using Naming Suggestor:**

```javascript
const currentDate = new Date();
const activeUsers = users.filter((user) => user.active);
function calculateDiscount(price, discountRate) {
  return price * discountRate * 0.1;
}
```

## Commands

- **Naming Suggestor: Suggest Better Names** - Analyze selected code and provide naming suggestions

## Requirements

- OpenAI API key
- Active internet connection
- VS Code 1.74.0 or higher

## Extension Settings

This extension contributes the following settings:

- `namingSuggestor.openaiApiKey`: Your OpenAI API key
- `namingSuggestor.model`: OpenAI model to use (gpt-3.5-turbo, gpt-4, gpt-4-turbo)

## Known Issues

- Large code selections may take longer to process
- API rate limits may apply based on your OpenAI plan

## Privacy

- Code is sent to OpenAI's servers for analysis
- No code is stored or logged by this extension
- Review OpenAI's privacy policy for their data handling practices

## Contributing

Found a bug or have a feature request? Please create an issue on our [GitHub repository](https://github.com/your-username/naming-suggestor-extension).

## License

This extension is licensed under the [MIT License](LICENSE).

---

**Enjoy cleaner, more readable code with AI-powered naming suggestions!** 🚀
