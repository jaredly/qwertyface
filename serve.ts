import { watch } from 'fs';
import path, { join } from 'path';

const bounce = (time: number, fn: () => unknown) => {
    let wait: null | Timer = null;
    return () => {
        if (wait != null) clearTimeout(wait);
        wait = setTimeout(() => fn(), time);
    };
};

let edited: string[] = [];
const rebuild = bounce(10, () => {
    console.log('rebuilding for', edited);
    edited = [];
    Promise.all([
        Bun.build({
            entrypoints: ['./run.tsx'],
            outdir: './build',
            naming: 'run.js',
        }),
    ]).catch((err) => {
        console.log('failed? idk');
    });
});

const service = Bun.serve({
    port: 3751,
    async fetch(req) {
        let pathname = new URL(req.url).pathname;
        if (pathname === '/') {
            pathname = '/index.html';
        } else {
            pathname = '/build' + pathname;
        }
        // if (pathname === '/favicon.png') {
        //     return new Response(Bun.file('../../../web/favicon.png'));
        // }
        // if (pathname.startsWith('/fonts/')) {
        //     const path = join('../../../web', pathname.slice(1));
        //     return new Response(Bun.file(path));
        // }
        const file = Bun.file(join('.', pathname));
        return new Response(file);
    },
});

const ignore = ['.git/', 'node_modules/', '.ow-data/', '.cli.sess', 'worker.js', 'run.js', 'keyboard/ui/run.js'];

watch('.', { recursive: true }, (event, filename) => {
    if (!filename || ignore.some((n) => filename.startsWith(n))) {
        // ignore
        return;
    }
    if (filename.match(/\.tsx?$/)) {
        edited.push(filename);
        rebuild();
    } else {
        console.log('ignore', filename);
    }
});

rebuild();

console.log(`Serving http://${service.hostname}:${service.port}`);
