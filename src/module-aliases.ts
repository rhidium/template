import moduleAlias from 'module-alias';

// Note: We can't use _moduleAliases in package.json
// as it doesn't work with ts-node-dev

// Changes should be reflected in tsconfig.json
// tsconfig.json = Intellisense
// module-alias = Runtime
moduleAlias.addAliases({
  '@': `${__dirname}/`,
});
