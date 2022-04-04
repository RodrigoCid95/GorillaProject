module.exports.On = function On(methods, args) {
  return (target, propertyKey, descriptor) => {
    if (!target.hasOwnProperty('routes')) {
      target.routes = []
    }
    methods = Array.isArray(methods) ? methods : [methods]
    const fun = propertyKey
    const middlewares = [propertyKey]
    if (typeof args === 'object') {
      if (args.beforeMiddlewares) {
        for (const middleware of args.beforeMiddlewares) {
          if (!target.hasOwnProperty(middleware)) {
            console.error('El middelware ' + middleware + ' no está declarado!')
            process.exit()
          } else {
            middlewares.unshift(middleware)
          }
        }
      }
      if (args.afterMiddlewares) {
        for (const middleware of args.afterMiddlewares) {
          if (!target.hasOwnProperty(middleware)) {
            console.error('El middleware ' + middleware + ' no está declarado!')
            process.exit()
          } else {
            middlewares.push(middleware)
          }
        }
      }
    }
    methods.forEach(function (method) {
      target.routes.push({
        path: typeof args === 'string' ? args : args.path,
        method: method,
        func: fun,
        middlewares,
      })
    })
    return descriptor
  }
}
module.exports.Prefix = function Prefix(prefix) {
  return function (constructor) {
    return class extends constructor {
      prefix = prefix;
    }
  }
}
module.exports.Methods = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  DELETE: 'delete'
}
module.exports.initHttpServer = function initHttpServer({ returnInstance = false, mm, distDir, mainDir, gorillaHttpConfig = {}, onMessage = console.log }) {
  const Path = require('path')
  const express = require('express')
  let app = express()
  const http = require('http')
  const server = http.createServer(app)
  const httpControllersPath = Path.join(distDir, 'httpControllers')
  const httpControllersClasses = require(httpControllersPath)
  const routers = []
  for (const nameClass in httpControllersClasses) {
    const httpControllersClass = httpControllersClasses[nameClass]
    if (httpControllersClass.prototype.routes) {
      const routes = httpControllersClass.prototype.routes
      delete httpControllersClass.prototype.routes
      let models = []
      if (httpControllersClass.prototype.models) {
        models = httpControllersClass.prototype.models.map(({ propertyMod, model }) => {
          return {
            propertyMod,
            model: mm.getModel(model)
          }
        })
        delete httpControllersClass.prototype.models
      }
      const instanceHttpController = new httpControllersClass()
      for (const { propertyMod, model } of models) {
        instanceHttpController[propertyMod] = model
      }
      let prefix = ''
      if (instanceHttpController.prefix) {
        prefix = `/${instanceHttpController.prefix}`
        delete instanceHttpController.prefix
      }
      const router = express.Router()
      for (let { path, middlewares, method, func } of routes) {
        path = prefix + path
        if (middlewares) {
          const midd = middlewares.map(middleware => instanceHttpController[middleware].bind(instanceHttpController))
          router[method](path, midd)
        } else {
          const fn = instanceHttpController[func].bind(instanceHttpController)
          router[method](path, fn)
        }
      }
      routers.push(router)
    }
  }
  const {
    port = (process.env.PORT ? parseInt(process.env.PORT) : 80),
    dev,
    events,
    pathsPublic,
    engineTemplates
  } = gorillaHttpConfig
  app.set('port', port)
  let externalIp = null
  if (dev && dev.showExternalIp) {
    const interfaces = require("os").networkInterfaces()
    if (dev.interfaceNetwork) {
      const inter = interfaces[dev.interfaceNetwork]
      if (inter) {
        externalIp = inter.find(item => {
          return item.family == 'IPv4'
        }).address
      } else {
        console.error(`\nLa interfáz de red "${dev.interfaceNetwork}" no existe!.\nSe pueden usar las isguientes interfaces:\n${Object.keys(interfaces).join(', ')}`)
        console.error('\nLa interfáz de red ' + dev.interfaceNetwork + ' no existe!.\nSe pueden usar las isguientes interfaces:\n' + Object.keys(interfaces).join(', '))
      }
    } else {
      console.error('\nNo se definió una interfaz de red.\nSe pueden usar las isguientes interfaces:\n' + Object.keys(interfaces).join(', '))
    }
  }
  if (events && events.beforeConfig) {
    app = events.beforeConfig(app)
  }
  if (pathsPublic) {
    pathsPublic.forEach(path => {
      const dirPublic = Path.resolve(mainDir, path.dir)
      app.use(path.route, express.static(dirPublic))
    });
  }
  if (engineTemplates) {
    app.engine(engineTemplates.ext, engineTemplates.callback);
    app.set('views', Path.normalize(engineTemplates.dirViews));
    app.set('view engine', engineTemplates.name);
  }
  if (events && events.afterConfig) {
    app = events.afterConfig(app);
  }
  app.use(express.json())
  for (const router of routers) {
    app.use(router)
  }
  if (events && events.beforeStarting) {
    events.beforeStarting(app)
  }
  server.listen(port, () => {
    onMessage(`Servidor corriendo en: http://localhost:${port}${externalIp ? ` y http://${externalIp}:${port}` : ''}`)
  })
  if (returnInstance) {
    return server
  }
}