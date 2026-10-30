import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        
       
         fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failded
        return response; 

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failded
        return null;
            
    }
}

const getPublicIdFromUrl = (url) => {
    const afterUpload = url.split("/upload/")[1];
    if(!afterUpload) return null

    return afterUpload
    .replace(/^v\d+\//, "")
    .replace(/\.[^/.]+$/, "")
}

const deleteFromCloudinary = async(url) => {
    try {
        if(!url) return null;

        const publicId = getPublicIdFromUrl(url);
        if (!publicId) return null;

        const response = await cloudinary.uploader.destroy(publicId);
        return response
        
    } catch (error) {
        return null
        
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}