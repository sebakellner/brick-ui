const only = (...groups) => (token) => groups.includes(token.path[0]);

const cssFile = (destination, filter) => ({
  destination,
  format: 'css/variables',
  filter,
  options: { selector: ':root', outputReferences: true, showFileHeader: false },
});

const platform = (files) => ({
  transformGroup: 'css',
  prefix: 'bk',
  buildPath: 'src/styles/tokens/',
  files,
});

export default {
  source: ['tokens/**/*.json'],
  platforms: {
    space: platform([cssFile('space.css', only('space'))]),
    rounded: platform([cssFile('rounded.css', only('radius'))]),
    color: platform([cssFile('color.css', only('palette', 'color', 'focus-ring'))]),
    control: platform([cssFile('control.css', only('button', 'input'))]),
    typography: platform([cssFile('typography.css', only('font', 'font-size', 'line-height'))]),
    base: platform([
      cssFile('base.css', only('border-width', 'control-height', 'transition', 'focus-ring-width', 'focus-ring-offset')),
    ]),
  },
};
