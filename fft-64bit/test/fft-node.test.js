import { expect } from 'chai';
import fs from 'fs';

// Setup browser-like environment for testing AudioWorklet
describe('FFTNode', () => {
  let FFTNode;
  
  before(async () => {
    // Mock browser APIs
    global.self = global;
    global.AudioWorkletNode = class AudioWorkletNode {
      constructor(context, name, options) {
        this.context = context;
        this.name = name;
        this.options = options;
        this.port = {
          onmessage: null,
          postMessage: () => {},
        };
      }
      connect(destination) {
        return destination;
      }
    };
    global.AudioWorkletProcessor = class AudioWorkletProcessor {
      constructor(options) {
        this.options = options;
      }
    };
    global.URL = {
      createObjectURL: () => 'blob:mock',
    };
    global.Blob = class Blob {
      constructor(parts, options) {
        this.parts = parts;
        this.options = options;
      }
    };
    global.WebAssembly = {
      compile: async (buffer) => ({ mock: 'module', buffer }),
      Instance: class Instance {
        constructor(module) {
          this.module = module;
          this.exports = {
            memory: { buffer: new ArrayBuffer(1024 * 1024) },
            malloc: (size) => 0,
            FFT: () => {},
            iFFT: () => {},
            bit_reverse: () => {},
          };
        }
      },
    };
    
    // Import FFTNode after setting up globals
    FFTNode = (await import('../fft-node.js')).default;
  });
  
  after(() => {
    delete global.AudioWorkletNode;
    delete global.AudioWorkletProcessor;
    delete global.URL;
    delete global.Blob;
    delete global.WebAssembly;
  });
  
  describe('FFTNode class', () => {
    it('should be a class', () => {
      expect(FFTNode).to.be.a('function');
      expect(FFTNode.name).to.equal('FFTNode');
    });
    
    it('should have static init method', () => {
      expect(FFTNode.init).to.be.a('function');
    });
  });
  
  describe('FFTNode.init()', () => {
    let mockContext;
    
    beforeEach(() => {
      mockContext = {
        audioWorklet: {
          addModule: async () => {},
        },
      };
    });
    
    it('should initialize without errors', async () => {
      await FFTNode.init(mockContext);
      expect(self.wasmModule).to.exist;
      expect(self.wasmModule.mock).to.equal('module');
    });
  });
  
  describe('FFTNode instance', () => {
    let mockContext, fftNode;
    
    beforeEach(async () => {
      mockContext = {
        audioWorklet: {
          addModule: async () => {},
        },
      };
      await FFTNode.init(mockContext);
      fftNode = new FFTNode(mockContext, [2]);
    });
    
    it('should create an instance', () => {
      expect(fftNode).to.be.instanceOf(FFTNode);
    });
    
    it('should have port with onmessage handler', () => {
      expect(fftNode.port).to.exist;
      expect(fftNode.port.onmessage).to.be.a('function');
    });
    
    it('should have getByteTimeDomainData method', () => {
      expect(fftNode.getByteTimeDomainData).to.be.a('function');
    });
    
    it('should have getWaveForm method', () => {
      expect(fftNode.getWaveForm).to.be.a('function');
    });
    
    it('should have getFloatFrequencyData method', () => {
      expect(fftNode.getFloatFrequencyData).to.be.a('function');
    });
    
    it('should handle port messages', () => {
      const mockData = {
        bins: new ArrayBuffer(128),
        waveForm: new ArrayBuffer(256),
      };
      
      fftNode.port.onmessage({ data: mockData });
      
      expect(fftNode.waveFormBuffer).to.equal(mockData.waveForm);
      expect(fftNode.fftBuffer).to.equal(mockData.bins);
    });
    
    it('should return Float64Array from getByteTimeDomainData', () => {
      const mockData = {
        bins: new ArrayBuffer(128),
        waveForm: new ArrayBuffer(256),
      };
      
      fftNode.port.onmessage({ data: mockData });
      const result = fftNode.getByteTimeDomainData();
      
      expect(result).to.be.instanceOf(Float64Array);
    });
    
    it('should return Float64Array from getWaveForm', () => {
      const mockData = {
        bins: new ArrayBuffer(128),
        waveForm: new ArrayBuffer(256),
      };
      
      fftNode.port.onmessage({ data: mockData });
      const result = fftNode.getWaveForm();
      
      expect(result).to.be.instanceOf(Float64Array);
    });
    
    it('should return Float64Array from getFloatFrequencyData', () => {
      const mockData = {
        bins: new ArrayBuffer(128),
        waveForm: new ArrayBuffer(256),
      };
      
      fftNode.port.onmessage({ data: mockData });
      const result = fftNode.getFloatFrequencyData();
      
      expect(result).to.be.instanceOf(Float64Array);
    });
  });
  
  describe('FFTProc processor', () => {
    it('should be defined in fft-node.js', () => {
      const content = fs.readFileSync('./fft-node.js', 'utf-8');
      expect(content).to.include('class FFTProc');
      expect(content).to.include('extends AudioWorkletProcessor');
    });
    
    it('should have FFT64 method', () => {
      const content = fs.readFileSync('./fft-node.js', 'utf-8');
      expect(content).to.include('FFT64(n, instance)');
    });
    
    it('should have process method', () => {
      const content = fs.readFileSync('./fft-node.js', 'utf-8');
      expect(content).to.include('process(inputs, outputs)');
    });
  });
  
  describe('FFT64 function', () => {
    it('should initialize sine table correctly', () => {
      const content = fs.readFileSync('./fft-node.js', 'utf-8');
      expect(content).to.include('Math.sin((2 * Math.PI * i) / N)');
    });
    
    it('should have inputPCM function', () => {
      const content = fs.readFileSync('./fft-node.js', 'utf-8');
      expect(content).to.include('const inputPCM');
      expect(content).to.include('inputPCM');
    });
    
    it('should have getFloatFrequencyData function', () => {
      const content = fs.readFileSync('./fft-node.js', 'utf-8');
      expect(content).to.include('function getFloatFrequencyData()');
    });
    
    it('should have getWaveForm function', () => {
      const content = fs.readFileSync('./fft-node.js', 'utf-8');
      expect(content).to.include('function getWaveForm()');
    });
    
    it('should call FFT and bit_reverse in getFloatFrequencyData', () => {
      const content = fs.readFileSync('./fft-node.js', 'utf-8');
      expect(content).to.include('FFT(complexRef');
      expect(content).to.include('bit_reverse(complexRef');
    });
    
    it('should call iFFT and bit_reverse in getWaveForm', () => {
      const content = fs.readFileSync('./fft-node.js', 'utf-8');
      expect(content).to.include('iFFT(complexRef');
      expect(content).to.include('bit_reverse(complexRef');
    });
  });
  
  describe('Module dependencies', () => {
    it('should only import from build/fft.wasm.js', () => {
      const content = fs.readFileSync('./fft-node.js', 'utf-8');
      const imports = content.match(/^import .* from ['"].*['"]/gm) || [];
      expect(imports.length).to.equal(1);
      expect(imports[0]).to.include('./build/fft.wasm.js');
    });
    
    it('should export FFTNode as default', () => {
      const content = fs.readFileSync('./fft-node.js', 'utf-8');
      expect(content).to.include('export default class FFTNode');
    });
  });
});
