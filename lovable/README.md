# Lovable build handoff

The specification pack is prepared and the user has authorized a working website. The primary [ASHA Saath Planner project](https://lovable.dev/projects/84ca52fd-1ccf-4574-ac3a-191a553287e0) is being implemented in Lovable. Its [preview](https://id-preview--84ca52fd-1ccf-4574-ac3a-191a553287e0.lovable.app) may require the owner's Lovable session. Read [current build status](../docs/BUILD_STATUS.md) and [context handoff](../docs/CONTEXT_HANDOFF.md) before sending another build request.

## Use in order

1. Read [plugin workflow](PLUGIN_WORKFLOW.md) for verified capabilities and current stack.
2. The initial request has already been sent. Use [initial prompt](INITIAL_PROMPT.md) and [upload manifest](UPLOAD_MANIFEST.md) as references; do not create another project.
3. [PROJECT_KNOWLEDGE.md](PROJECT_KNOWLEDGE.md) is already set as persistent **project** knowledge. It is kept below the connector's 10,000-character limit. Read/merge existing knowledge before any update.
4. Follow [BUILD_PROMPTS.md](BUILD_PROMPTS.md) one phase at a time.
5. Review [REVIEW_CHECKLIST.md](REVIEW_CHECKLIST.md) and update [context handoff](../docs/CONTEXT_HANDOFF.md) after actual checks.

Project-specific ASHA rules belong in project knowledge, not shared workspace knowledge affecting unrelated projects. Local skills can be read directly or deliberately imported into the future workspace. Their external document references must travel with them.

Do not paste the whole 79-page research report into every chat turn. Keep the compact context always available and attach specialist contracts when implementing that feature.
