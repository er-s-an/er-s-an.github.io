async function createLiquidMetal(canvas, sources, width = 600, height = 400, onLoss = () => {}) {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
  if (!gl) throw new Error('WebGL2 unavailable');
  let disposed = false;
  let repaint = () => {};
  const textures = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const shaders = [];
  const resize = new ResizeObserver(entries => {
    const { width: w, height: h } = entries[0].contentRect;
    if (!w || !h) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(w * ratio));
    canvas.height = Math.max(1, Math.round(h * ratio));
    repaint();
  });
  const destroy = () => {
    if (disposed) return;
    disposed = true;
    resize.disconnect();
    textures.forEach(texture => gl.deleteTexture(texture));
    shaders.forEach(shader => gl.deleteShader(shader));
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  };
  canvas.addEventListener('webglcontextlost', () => { destroy(); onLoss(); }, { once: true });
  try {
    const vertex = `#version 300 es
      in vec2 position;
      void main() { gl_Position = vec4(position, 0., 1.); }`;
    const fragment = `#version 300 es
      precision highp float;
      uniform sampler2D fromLogo, toLogo;
      uniform vec2 resolution, shape;
      uniform float progress, time;
      out vec4 color;
      float smoothUnion(float a, float b, float k) {
        float h = clamp(.5 + .5 * (b - a) / k, 0., 1.);
        return mix(b, a, h) - k * h * (1. - h);
      }
      float logo(sampler2D image, vec2 p, float smoothing) {
        vec2 uv = p / vec2(shape.x / shape.y, 1.) + .5;
        vec2 field = texture(image, uv).rg;
        return mix(field.r, field.g, smoothing);
      }
      float surface(vec2 p, float smoothing) {
        if (progress <= 0.) return logo(fromLogo, p, smoothing);
        if (progress >= 1.) return logo(toLogo, p, smoothing);
        float flow = max(0., sin(progress * 3.14159265));
        vec2 q = p + flow * vec2(.045 * sin(p.y * 18. + time * 2.2), .035 * sin(p.x * 17. - time * 2.7));
        float glyph = progress < .5 ? logo(fromLogo, q, max(smoothing, flow)) : logo(toLogo, q, max(smoothing, flow));
        vec2 poolPoint = vec2(q.x / max(1., shape.x / shape.y / 1.5), q.y);
        vec2 center = vec2(.035 * sin(time * 1.4), .11 + .025 * sin(time * 2.));
        float pool = (length((poolPoint - center) / vec2(1.75, .65)) - .19) * .65;
        pool = smoothUnion(pool, length(poolPoint - center - vec2(-.23, -.025 + .025 * sin(time * 2.))) - .10, .085);
        pool = smoothUnion(pool, length(poolPoint - center - vec2(.21, .015 + .035 * cos(time * 1.7))) - .085, .08);
        float blend = smoothstep(0., .48, progress) * (1. - smoothstep(.52, 1., progress));
        float d = mix(glyph, pool, blend);
        d -= .012 * flow;
        if (flow > .01) {
          for (int i = 0; i < 3; i++) {
            float n = float(i);
            vec2 drop = vec2((n - 1.) * .18 + .03 * sin(time * 2. + n), .13 + flow * (.12 + .04 * sin(time * 3. + n)));
            d = smoothUnion(d, length((p - drop) / vec2(.8, 1.3)) - .033 * flow, .045 * flow);
          }
        }
        return d;
      }
      void main() {
        float fit = min(resolution.x / shape.x, resolution.y / shape.y);
        vec2 p = (gl_FragCoord.xy - resolution * .5) / (fit * shape.y);
        p.y *= -1.;
        float d = surface(p, 0.);
        float aa = max(fwidth(d), .0006);
        float alpha = 1. - smoothstep(-aa, aa, d);
        if (alpha < .002) { color = vec4(0.); return; }
        float e = .004;
        vec2 grad = vec2(surface(p + vec2(e, 0.), 1.) - surface(p - vec2(e, 0.), 1.), surface(p + vec2(0., e), 1.) - surface(p - vec2(0., e), 1.)) / (2. * e);
        float depth = max(-d, 0.);
        float fluid = pow(max(0., sin(progress * 3.14159265)), 4.);
        vec3 normal = normalize(vec3(grad * 1.7 * exp(-depth / mix(.0045, .09, fluid)), 1.));
        normal.xy += vec2(sin(p.y * 9. + time * .4), cos(p.x * 11. - time * .3)) * .10;
        normal = normalize(normal);
        vec3 reflection = reflect(vec3(0., 0., -1.), normal);
        float band = .5 + .5 * sin(reflection.y * mix(2.8, 5.4, fluid) + reflection.x * mix(.8, 1.6, fluid) + p.y * 8. + time * .32);
        vec3 metal = mix(vec3(.055, .085, .15), vec3(.83, .89, .99), smoothstep(.12, .7, band));
        float strip = pow(max(0., cos(reflection.y * 4.2 + reflection.x * .6 + time * .12)), 28.);
        metal += strip * .65;
        metal += pow(max(dot(normal, normalize(vec3(-.5, -.8, 1.))), 0.), 32.) * .85;
        metal += pow(1. - abs(normal.z), 3.) * vec3(.18, .21, .27);
        metal = mix(metal, metal * vec3(1., .86, .98), .12 + .1 * sin(p.x * 4. + time));
        color = vec4(metal, alpha);
      }`;
    for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
      const shader = gl.createShader(type);
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const images = await Promise.all(sources.map(async source => {
      const image = new Image();
      image.src = source;
      await image.decode();
      return image;
    }));
    if (disposed) throw new Error('Metal renderer disposed');
    const raster = document.createElement('canvas');
    const ctx = raster.getContext('2d', { willReadFrequently: true });
    images.forEach(image => {
      raster.width = image.naturalWidth;
      raster.height = image.naturalHeight;
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, raster.width, raster.height).data;
      const count = raster.width * raster.height / 2;
      const field = new Float32Array(count * 2);
      for (let i = 0; i < count; i++) for (let layer = 0; layer < 2; layer++) {
        const offset = (i + layer * count) * 4;
        field[i * 2 + layer] = (pixels[offset] * 256 + pixels[offset + 1]) / 4095 * .5 - .25;
      }
      const texture = gl.createTexture();
      textures.push(texture);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, raster.width, raster.height / 2, 0, gl.RG, gl.FLOAT, field);
    });
    const uniforms = Object.fromEntries(['fromLogo', 'toLogo', 'resolution', 'shape', 'progress', 'time'].map(key => [key, gl.getUniformLocation(program, key)]));
    resize.observe(canvas);
    let lastFrame;
    const renderer = {
      destroy,
      draw(from, to, progress, time) {
        if (disposed) return;
        lastFrame = [from, to, progress, time];
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(program);
        [from, to].forEach((index, unit) => {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, textures[index]);
        });
        gl.uniform1i(uniforms.fromLogo, 0);
        gl.uniform1i(uniforms.toLogo, 1);
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl.uniform2f(uniforms.shape, width, height);
        gl.uniform1f(uniforms.progress, progress);
        gl.uniform1f(uniforms.time, time);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    };
    repaint = () => { if (lastFrame) renderer.draw(...lastFrame); };
    return renderer;
  } catch (error) { destroy(); throw error; }
}
