import * as vscode from "vscode";
import OpenAI from "openai";

interface NamingSuggestion {
  original: string;
  suggestion: string;
  reasoning: string;
}

export class NamingSuggestor {
  private openai: OpenAI | null = null;

  private getOpenAI(): OpenAI {
    if (this.openai) {
      return this.openai;
    }

    const config = vscode.workspace.getConfiguration("namingSuggestor");
    const apiKey = config.get<string>("openaiApiKey");

    if (!apiKey) {
      throw new Error(
        "OpenAI API key is not configured. Please set it in the extension settings."
      );
    }

    this.openai = new OpenAI({ apiKey });
    return this.openai;
  }

  public async suggestNames(
    editor: vscode.TextEditor,
    selectedText: string
  ): Promise<void> {
    const progressOptions: vscode.ProgressOptions = {
      location: vscode.ProgressLocation.Notification,
      title: "Getting naming suggestions...",
      cancellable: true,
    };

    await vscode.window.withProgress(
      progressOptions,
      async (progress, token) => {
        progress.report({ increment: 0 });

        try {
          progress.report({ increment: 30, message: "Analyzing code..." });

          const suggestions = await this.getSuggestionsFromOpenAI(
            selectedText,
            token
          );

          if (token.isCancellationRequested) {
            return;
          }

          progress.report({
            increment: 70,
            message: "Processing suggestions...",
          });

          if (suggestions.length === 0) {
            vscode.window.showInformationMessage(
              "No naming suggestions found for the selected code."
            );
            return;
          }

          await this.presentSuggestions(editor, suggestions);
        } catch (error) {
          throw error;
        }
      }
    );
  }

  private async getSuggestionsFromOpenAI(
    code: string,
    token: vscode.CancellationToken
  ): Promise<NamingSuggestion[]> {
    const openai = this.getOpenAI();
    const config = vscode.workspace.getConfiguration("namingSuggestor");
    const model = config.get<string>("model") || "gpt-3.5-turbo";
    const maxSuggestions = config.get<number>("maxSuggestions") || 20;

    // Get user preferences for what to include
    const includeVariables = config.get<boolean>("includeVariables") ?? true;
    const includeFunctions = config.get<boolean>("includeFunctions") ?? true;
    const includeParameters = config.get<boolean>("includeParameters") ?? true;
    const includeClasses = config.get<boolean>("includeClasses") ?? true;

    const includeTypes: string[] = [];
    if (includeVariables) {
      includeTypes.push("variables");
    }
    if (includeFunctions) {
      includeTypes.push("functions");
    }
    if (includeParameters) {
      includeTypes.push("parameters");
    }
    if (includeClasses) {
      includeTypes.push("classes");
    }

    if (includeTypes.length === 0) {
      return []; // No types selected
    }

    const prompt = `Analyze the following code and suggest better names for ${includeTypes.join(
      ", "
    )}. 
Consider:
- Clarity and descriptiveness
- Convention following (camelCase, PascalCase, etc.)
- Context and purpose
- Avoiding abbreviations when possible
- Maximum ${maxSuggestions} suggestions

Code to analyze:
\`\`\`
${code}
\`\`\`

Please respond with a JSON array of objects with this structure:
[
  {
    "original": "original_name",
    "suggestion": "better_name", 
    "reasoning": "explanation of why this is better"
  }
]

Only suggest improvements where the new name would be significantly better. If the code already has good naming, return an empty array.`;

    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      });

      if (token.isCancellationRequested) {
        return [];
      }

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        return JSON.parse(jsonString) as NamingSuggestion[];
      } catch (parseError) {
        console.error("Failed to parse OpenAI response:", content);
        throw new Error(
          "Failed to parse naming suggestions from OpenAI response"
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("API key")) {
        throw new Error(
          "Invalid OpenAI API key. Please check your configuration."
        );
      }
      throw error;
    }
  }

  private async presentSuggestions(
    editor: vscode.TextEditor,
    suggestions: NamingSuggestion[]
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration("namingSuggestor");
    const autoApply = config.get<boolean>("autoApply") ?? false;
    const maxSuggestions = config.get<number>("maxSuggestions") || 5;

    // Limit suggestions to max configured
    const limitedSuggestions = suggestions.slice(0, maxSuggestions);

    // Auto-apply first suggestion if enabled
    if (autoApply && limitedSuggestions.length > 0) {
      await this.applyNamingSuggestions(editor, [limitedSuggestions[0]]);
      return;
    }

    const items = limitedSuggestions.map((suggestion) => ({
      label: `${suggestion.original} → ${suggestion.suggestion}`,
      description: suggestion.reasoning,
      suggestion: suggestion,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: "Select a naming suggestion to apply",
      canPickMany: true,
    });

    if (selected && selected.length > 0) {
      await this.applyNamingSuggestions(
        editor,
        selected.map((item) => item.suggestion)
      );
    }
  }

  private async applyNamingSuggestions(
    editor: vscode.TextEditor,
    suggestions: NamingSuggestion[]
  ): Promise<void> {
    const workspaceEdit = new vscode.WorkspaceEdit();
    const document = editor.document;

    suggestions.forEach((suggestion) => {
      const text = document.getText();
      const regex = new RegExp(
        `\\b${this.escapeRegExp(suggestion.original)}\\b`,
        "g"
      );
      let match;

      while ((match = regex.exec(text)) !== null) {
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);

        workspaceEdit.replace(document.uri, range, suggestion.suggestion);
      }
    });

    const success = await vscode.workspace.applyEdit(workspaceEdit);
    if (success) {
      const count = suggestions.length;
      vscode.window.showInformationMessage(
        `Applied ${count} naming suggestion${count > 1 ? "s" : ""}`
      );
    } else {
      vscode.window.showErrorMessage("Failed to apply naming suggestions");
    }
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
