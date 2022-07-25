#!/usr/bin/env node
'use strict';
((command = 'start') => {
  if (command) {
    const fs = require('fs');
    const path = require('path');
    const { Flags } = require('./../core');
    const flags = new Flags();
    const mainDir = path.resolve(process.cwd());
    const sourceDir = path.join(mainDir, 'src');
    const packagePath = path.join(mainDir, 'package.json');
    const tsConfigPath = path.join(mainDir, 'tsconfig.json');
    const tsconfig = require(tsConfigPath);
    const pack = require(packagePath);
    const external = Object.keys(pack.dependencies || { 'gorilla': null });
    const gorillaSettings = pack.gorilla || {};
    const type = gorillaSettings.type || flags.get('type') || 'http';
    const boot = gorillaSettings.boot || 'auto';
    const distDir = (command === 'build') ? path.join(mainDir, 'dist', 'server') : path.join(mainDir, 'dist');

    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }

    const log = (message) => {
      if (process.stdout.clearLine) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
      }
      if (process.stdout.write) {
        process.stdout.write(message);
      } else {
        console.log(message);
      }
    };

    const modules = [
      { input: path.join(sourceDir, 'config', 'index.ts'), output: path.join(distDir, 'configProfiles.js') },
      { input: path.join(sourceDir, 'libraries', 'index.ts'), output: path.join(distDir, 'libs.js') },
      { input: path.join(sourceDir, 'models', 'index.ts'), output: path.join(distDir, 'models.js') }
    ];

    if (type === 'http' || type === 'http-sockets') {
      modules.push({ input: path.join(sourceDir, 'controllers', 'http.ts'), output: path.join(distDir, 'httpControllers.js') });
    }

    if (type === 'sockets' || type === 'http-sockets') {
      modules.push({ input: path.join(sourceDir, 'controllers', 'sockets.ts'), output: path.join(distDir, 'socketsControllers.js') });
    }

    if (boot === 'manual') {
      modules.push({ input: path.join(sourceDir, 'main.ts'), output: path.join(distDir, 'main.js') });
    }

    modules.forEach(({ input }) => {
      if (!fs.existsSync(input)) {
        console.error(`El modulo ${input.replace(mainDir, '')} no está declarado!`);
        process.exit();
      }
    });

    let compute;
    const initServer = () => {
      log('Iniciando servidor...');
      const { fork } = require('child_process');
      const serverPath = boot === 'auto' ? path.resolve(__dirname, 'server.js') : path.join(distDir, 'main.js');
      compute = fork(serverPath, boot === 'auto' ? ['--type', type, '--mainDir', mainDir, '--sourceDir', sourceDir, '--distDir', distDir] : []);
      compute.on('message', log);
      compute.on('error', code => {
        console.error(code);
      });
    };

    const { build } = require('esbuild');

    const builders = modules.map(({ input, output }) => {
      const sm = tsconfig.compilerOptions.sourceMap;
      const sourcemap = sm ? true : false;
      const options = {
        entryPoints: [input],
        outfile: output,
        external,
        bundle: true,
        target: 'node12',
        format: 'cjs',
        platform: 'node',
        tsconfig: tsConfigPath,
      };
      if (command === 'start') {
        options.sourcemap = sourcemap;
        options.watch = {
          onRebuild: (error) => {
            if (compute && !compute.killed) {
              compute.kill();
              log('Servidor detenido!');
            }
            if (!error) {
              initServer();
            }
          }
        };
      } else {
        options.sourcemap = true;
        options.watch = false;
        if (flags.get('m') || flags.get('minify')) {
          options.minify = true;
        }
      }
      return build(options);
    });

    Promise.all(builders).then(() => {
      if (command === 'start') {
        initServer();
      } else {
        const newPackage = {
          name: pack.name || 'gorila-server',
          version: pack.version || '1.0.0',
          description: pack.description || '',
          main: './server/main.js',
          scripts: {
            start: 'node .'
          },
          dependencies: {
            ...(pack.dependencies || {}),
            gorilla: 'file:./gorilla'
          },
          licence: pack.licence || 'ISC'
        };
        if (type === 'http' || type === 'http-sockets') {
          newPackage.dependencies['express'] = '^4.17.3';
        }
        if (type === 'sockets' || type === 'http-sockets') {
          newPackage.dependencies['socket.io'] = '^4.4.1';
        }
        const rootdir = path.resolve(distDir, '..');
        fs.writeFileSync(path.join(rootdir, 'package.json'), JSON.stringify(newPackage), { encoding: 'utf8' });
        const gorillaPath = path.join(rootdir, 'gorilla');
        if (fs.existsSync(gorillaPath)) {
          fs.rmSync(gorillaPath, { recursive: true, force: true });
        }
        fs.mkdirSync(gorillaPath);
        fs.copyFileSync(path.resolve(__dirname, '..', 'core', 'index.js'), path.join(gorillaPath, 'core.js'));
        if (type === 'http' || type === 'http-sockets') {
          fs.copyFileSync(path.resolve(__dirname, '..', 'http', 'index.js'), path.join(gorillaPath, 'http.js'));
        }
        if (type === 'sockets' || type === 'http-sockets') {
          fs.copyFileSync(path.resolve(__dirname, '..', 'web-sockets', 'index.js'), path.join(gorillaPath, 'web-sockets.js'));
        }
        const publicPaths = gorillaSettings['public-paths'] || [];
        for (const publicPath of publicPaths) {
          const srcDir = path.join(mainDir, publicPath);
          if (fs.existsSync(srcDir)) {
            const destDir = path.join(rootdir, publicPath);
            fs.cpSync(srcDir, destDir, { recursive: true, force: true });
          }
        }
        if (boot === 'auto') {
          const bootPath = path.join(__dirname, 'boots', `${type}.js`);
          const bootDestDit = path.join(rootdir, 'server', 'main.js');
          fs.copyFileSync(bootPath, bootDestDit);
        }
      }
    })
  } else {
    console.log('Gorilla Framework!\n');
  }
})(process.argv.slice(2)[0]);
