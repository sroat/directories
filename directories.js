// Helper to represent the tree object in simple object easy to parse
function getNested(originalObject, path, separator) {
  try {
    const localSeparator = separator || '.';

    return path.replace('[', localSeparator).replace(']', '').split(localSeparator).reduce(
      (obj, property) => obj[property], originalObject,
    );
  } catch (err) {
    return undefined;
  }
}

class FileSystem {
  constructor() {
    this.state = {
    };
  }

  CREATE(pathToCreate, objToModify = this.state) {
    const elementsToAdd = pathToCreate.split('/');

    // Check invalid call with empty string
    if (!`${elementsToAdd[0]}`) {
      return;
    }

    // Try to recover existing items, or create a new one
    if (!objToModify[`${elementsToAdd[0]}`]) {
      objToModify[`${elementsToAdd[0]}`] = {};
    }

    // Recursively call itself until deeper level of dir to create
    if (elementsToAdd.length > 1) {
      const [, ...rest] = elementsToAdd;
      this.CREATE(rest.join('/'), objToModify[`${elementsToAdd[0]}`]);
    }
  }

  LIST(objToList = this.state, spacing = 0) {
    // If no object to draw, or reached the deeper level, return
    if (!objToList) {
      return;
    }
    Object.keys(objToList).forEach((folder) => {
      const indentString = ''.padStart(spacing, ' ');
      // eslint-disable-next-line no-console
      console.log(indentString, folder);
      this.LIST(objToList[folder], spacing + 1);
    });
  }

  MOVE(originPath, destPath, objToModify = this.state) {
    const originPathArray = originPath.split('/');
    const elementToMove = originPathArray[originPathArray.length - 1];

    // Check invalid options
    if (!elementToMove || !destPath) {
      return;
    }

    const objToMove = getNested(objToModify, originPath, '/');
    let pathsInObject = JSON.stringify(objToMove).toString();

    // Get all the possible paths for each sub-directory to move
    pathsInObject = pathsInObject.replace(/[{}]/g, '');
    pathsInObject = pathsInObject.replace(/["]/g, '');
    pathsInObject = pathsInObject.replace(/[:]/g, '/');

    const pathsToUpdate = pathsInObject.split(',');

    // Create the subdirs in the new location
    for (const i in pathsToUpdate) {
      this.CREATE(destPath + '/' + elementToMove + '/' + pathsToUpdate[i], objToModify);
    }

    // Remove old location
    this.DELETE(originPath, objToModify);
  }

  DELETE(pathToDelete, objToModify = this.state, originalPath = pathToDelete) {
    const elementsInPath = pathToDelete.split('/');

    // Check invalid call with empty string
    if (!`${elementsInPath[0]}`) {
      return;
    }

    // Try to recover existing items, or create a new one
    if (!objToModify[`${elementsInPath[0]}`]) {
      // eslint-disable-next-line no-console
      console.log(`Cannot delete ${originalPath} - ${elementsInPath[0]} does not exist`);
      return;
    }

    // Remove the desired element
    if (elementsInPath.length === 1) {
      delete objToModify[`${elementsInPath[0]}`];
    } else {
      // Keep calling until get the element to remove
      const [, ...rest] = elementsInPath;
      this.DELETE(rest.join('/'), objToModify[`${elementsInPath[0]}`], originalPath);
    }
  }
}

const instructions = `
CREATE fruits
CREATE vegetables
CREATE grains
CREATE fruits/apples
CREATE fruits/apples/fuji
LIST
CREATE grains/squash
MOVE grains/squash vegetables
CREATE foods
MOVE grains foods
MOVE fruits foods
MOVE vegetables foods
LIST
DELETE fruits/apples
DELETE foods/fruits/apples
LIST
`;

const dir = new FileSystem();
const run = instructions.split('\n');
run.forEach((cmd) => {
  if (cmd) {
    // eslint-disable-next-line no-console
    console.log(cmd);
    const [func, ...args] = cmd.split(' ');
    dir[func](...args);
  }
});
