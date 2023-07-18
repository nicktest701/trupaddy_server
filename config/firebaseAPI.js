const {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} = require('firebase/storage');

const { storage } = require('../firebase');

const uploadPostImage = async (name, uri) => {
  const storageRef = ref(storage, 'posts/images/' + name);
  console.log('1');

  try {
    console.log('2');
    const response = await fetch(uri);
    const blob = await response.blob();

    const uploadTask = await uploadBytesResumable(storageRef, blob);
    const url = await getDownloadURL(uploadTask.ref);

    return url;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

const uploadPostVideo = async (name, uri) => {
  const storageRef = ref(storage, 'posts/videos/' + name);

  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const uploadTask = await uploadBytesResumable(storageRef, blob);
    const url = await getDownloadURL(uploadTask.ref);

    return url;
  } catch (error) {
    throw new Error(error);
  }
};

const uploadImage = async (name, uri) => {
  const storageRef = ref(storage, 'photos/' + name);

  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const uploadTask = await uploadBytesResumable(storageRef, blob);
    const url = await getDownloadURL(uploadTask.ref);
    return url;
  } catch (error) {
    throw new Error(error);
  }
};

async function uploadImages(images) {
  try {
    const imagePromises = Array.from(images, (image) =>
      uploadImage(image.name, image.uri)
    );

    const imageRes = await Promise.all(imagePromises);
    return imageRes;
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = {
  uploadPostImage,
  uploadPostVideo,
  uploadImage,
  uploadImages,
};
