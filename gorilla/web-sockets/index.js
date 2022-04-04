module.exports.On = function On(nameEvent, args) {
  return (target, propertyKey, descriptor) => {
    if (!target.hasOwnProperty('routes')) {
      target.routes = []
    }
    target.routes.push({ nameEvent, propertyKey })
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
module.exports.initSocketsServer = function initSocketsServer({ http, mm, lm, distDir, gorilaSocketsConfig = {}, onError = console.error }) {
  const path = require('path')
  const SocketIO = require('socket.io')
  let io = null
  let port = 80
  if (http) {
    io = new SocketIO.Server(http, gorilaSocketsConfig)
  } else {
    if (gorilaSocketsConfig.port) {
      port = gorilaSocketsConfig.port
    }
    if (process.env.PORT) {
      port = parseInt(process.env.PORT)
    }
    io = SocketIO(port, gorilaSocketsConfig)
  }
  const socketsControllersPath = path.join(distDir, 'socketsControllers')
  const socketsControllersClasses = require(socketsControllersPath)
  const sRoutes = []
  for (const nameClass in socketsControllersClasses) {
    const socketsControllersClass = socketsControllersClasses[nameClass]
    if (socketsControllersClass.prototype.routes) {
      const routes = socketsControllersClass.prototype.routes
      delete socketsControllersClass.prototype.routes
      let models = []
      if (socketsControllersClass.prototype.models) {
        models = socketsControllersClass.prototype.models.map(({ propertyMod, model }) => {
          return {
            propertyMod,
            model: mm.getModel(model)
          }
        })
        delete socketsControllersClass.prototype.models
      }
      const instanceSocketsController = new socketsControllersClass()
      instanceSocketsController['io'] = io
      for (const { propertyMod, model } of models) {
        instanceSocketsController[propertyMod] = model
      }
      let prefix = ''
      if (instanceSocketsController.prefix) {
        prefix = `/${instanceSocketsController.prefix}`
        delete instanceSocketsController.prefix
      }
      for (const { nameEvent, propertyKey } of routes) {
        sRoutes.push({
          nameEvent,
          callback: instanceSocketsController[propertyKey].bind(instanceSocketsController)
        })
      }
    }
  }
  io.on('connect', socket => {
    if (gorilaSocketsConfig.events && gorilaSocketsConfig.events.onConnect) {
      gorilaSocketsConfig.events.onConnect(socket)
    }
    for (const { nameEvent, callback } of sRoutes) {
      socket.on(nameEvent, (...args) => {
        const end = args.find(arg => typeof arg === 'function')
        let argmnts = args.filter(arg => typeof arg !== 'function')
        const { getLibrary } = lm
        try {
          if (gorilaSocketsConfig.events && gorilaSocketsConfig.events.onANewRequest) {
            argmnts = gorilaSocketsConfig.events.onANewRequest(argmnts, socket, getLibrary);
          }
          argmnts.push(socket, io)
          let contentReturn = callback(...argmnts)
          if (contentReturn instanceof Promise) {
            contentReturn.then((response) => {
              if (gorilaSocketsConfig.events && gorilaSocketsConfig.events.onBeforeToAnswer) {
                response = socketsConfig.events.onBeforeToAnswer(response, socket, getLibrary)
              }
              if (end) {
                end(response)
              }
            }).catch(error => {
              error = {
                ...error,
                error: true,
                level: error.code != undefined ? 1 : 0,
                code: error.code != undefined ? error.code : 0,
                message: error.message != undefined ? error.message : error
              }
              if (end) {
                end(end)
              }
              onError(JSON.stringify(end))
            });
          } else {
            if (gorilaSocketsConfig.events && gorilaSocketsConfig.events.onBeforeToAnswer) {
              contentReturn = socketsConfig.events.onBeforeToAnswer(contentReturn, socket, getLibrary)
            }
            if (end) {
              end(contentReturn)
            }
          }
        } catch (error) {
          error = {
            ...error,
            error: true,
            level: 0,
            code: error.code !== undefined ? error.code : 0,
            message: error.message !== undefined ? error.message : error,
            stack: error.stack
          }
          onError(JSON.stringify(end))
          if (gorilaSocketsConfig.events && gorilaSocketsConfig.events.onBeforeToAnswer) {
            error = gorilaSocketsConfig.events.onBeforeToAnswer(error, socket, getLibrary)
          }
          if (end) {
            end(contentReturn)
          }
        }
      })
    }
  })
}