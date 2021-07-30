export default function extractMetadata(text) {
    let pragmas = extractPragmas(text);
    let metadata = {
        title: pragmas["title"],
        description: pragmas["description"],
        from: pragmas["from"],
    };
    return metadata;
}

function extractPragmas(text) {
    let lines = text.split("\n");

    let pragmas = {};
    lines.forEach(
        line => {
            let match = line.match("^#pragma (.*?) (.*)$");
            if (match !== null) {
                pragmas[match[1]] = match[2];
            }
        }
    );

    return pragmas;
}
