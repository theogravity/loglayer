import { LogLayer } from '../src/LogLayer'

export function testMethods(p: LogLayer) {
  console.log('===== info() ====')
  p.info('info', 'message', '3')

  console.log('===== warn() ====')
  p.warn('warn message %s', 1)

  console.log('===== error() ====')
  p.error('error message')

  console.log('===== debug() ====')
  p.debug('debug message')

  console.log('===== trace() ====')
  p.trace('trace message')

  console.log('===== withMetadata() ====')
  p.withMetadata({
    test: 'metadata',
    test2: 'metadata2',
  }).trace('trace message')

  console.log('===== withError() ====')
  p.withError(new Error('error object')).trace('trace message')

  console.log('===== withError() + withMetadata() ====')
  p.withMetadata({
    test: 'metadata',
    test2: 'metadata2',
  })
    .withError(new Error('error object'))
    .error('error message')

  console.log('===== onlyError() ====')
  p.errorOnly(new Error('error message'))

  console.log('===== onlyMetadata() ====')
  p.metadataOnly({
    only: 'metadata',
  })

  console.log('===== withContext() ====')
  p.withContext({
    test: 'data',
  })

  p.info('context data')
}
