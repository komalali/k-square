function getBranch(branchResolver, tree) {
  if (branchResolver instanceof Function) {
    return branchResolver(tree);
  } else if (tree[branchResolver]) {
    return tree[branchResolver];
  }
  return false;
}

function treeReduce(tree, iterator, accumulator = [], branchResolver = 'children', parents = []) {
  if (!tree) return accumulator;

  const values = (tree instanceof Array) ? tree : [tree];

  return values.reduce((results, subTree) => {
    const result = iterator(results, subTree, parents);
    const branch = getBranch(branchResolver, subTree);

    if (branch && branch.length) {
      return treeReduce(branch, iterator, result, branchResolver, parents.concat([subTree]));
    }

    return results;
  }, accumulator);
}

function treeMap(tree, iterator, branchKey = 'children', parents = []) {
  if (!tree) return [];

  const values = (tree instanceof Array) ? tree : [tree];

  return values.map((subTree) => {
    const result = iterator(subTree, parents);
    const branch = getBranch(branchKey, subTree);

    if (branch && branch.length) {
      result[branchKey] = treeMap(branch, iterator, branchKey, parents.concat([subTree]));
    }

    return result;
  });
}

function treeEach(tree, iterator, branchResolver = 'children', parents = []) {
  if (!tree) return false;

  const values = (tree instanceof Array) ? tree : [tree];

  return values.forEach((subTree) => {
    iterator(subTree, parents);
    const branch = getBranch(branchResolver, subTree);

    if (branch && branch.length) {
      treeEach(branch, iterator, branchResolver, parents.concat([subTree]));
    }
  });
}

function treeFilter(tree, filter, branchKey = 'children', parents = []) {
  const values = (tree instanceof Array) ? tree : [tree];

  return values.reduce((results, subTree) => {
    if (filter(subTree, parents)) {
      const branch = getBranch(branchKey, subTree);

      if (branch && branch.length) {
        results.push({
          ...subTree,
          [branchKey]: treeFilter(branch, filter, branchKey, parents.concat([subTree])),
        });
      } else {
        results.push(subTree);
      }
    }

    return results;
  }, []);
}

export { treeMap, treeReduce, treeEach, treeFilter };
