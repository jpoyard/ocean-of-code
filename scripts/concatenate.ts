import {createWriteStream, existsSync, mkdirSync, readFileSync} from 'fs';

const FILES_NAMES: string[] = [
    'position.class.ts',
    'cell.class.ts',
    'cell-container.class.ts',
    'surface.class.ts',
    'grid.class.ts',
    'path-resolver.class.ts',
    'submarine.class.ts',
    'opponent-submarine.class.ts',
    'our-submarine.class.ts',
    'runner.ts'
];

const SOURCE_PATH = './src/app';
const TARGET_PATH = './dist';
const TARGET_FILE_NAME = 'codingGame.ts';
const TARGET_FILE = `${TARGET_PATH}/${TARGET_FILE_NAME}`;

if (!existsSync(TARGET_PATH)) {
    console.log(`creates ${TARGET_PATH} path`);
    mkdirSync(TARGET_PATH);
}

const writeFileStream = createWriteStream(TARGET_FILE);

FILES_NAMES.forEach(filename => {
    const sourceFilePath = `${SOURCE_PATH}/${filename}`;
    if (existsSync(sourceFilePath)) {
        console.log(`read file ${sourceFilePath}...`);
        const content: string = readFileSync(sourceFilePath).toString();
        writeFileStream.write(`\n/**\n * file ${filename}\n *\n **/\n`);
        content.split(/\r\n/gm).forEach(
            line => {
                if (!line.includes('import')) {
                    writeFileStream.write(line.replace(/export /, ''));
                    writeFileStream.write('\r\n');
                }
            }
        )
    }
});

writeFileStream.end();

