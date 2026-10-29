import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) => {
   try {
     const user = await User.findById(userId)
     const accessToken = await user.generateAccessToken() // need to write await otherwise accessToken is a promise or object
     const refreshToken = await user.generateRefreshToken()

     user.refreshToken = refreshToken
     await user.save({validateBeforeSave: false})

     return {accessToken, refreshToken}
    
   } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
    
   }
}



const registerUser = asyncHandler( async(req, res) => {
 // get user details from frontend
 // validation-not empty
 // check if user already exists: username, email
 // check for images, check for avatar
 // upload them to cloudinary 
 // create user object-create entry in db
 // remove password and refresh token field from response
 // check for user creation 
 // return res 

 const {fullName, email, username, password}= req.body
  //  
  if(
    [fullName,email,username,password].some((field) => 
        field?.trim() === "")
  ){
    throw new ApiError(400, "All fields are required")
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })
  if(existedUser){
    throw new ApiError(409, "User with email or username already exists")
  }
  
  
  const avatarLocalPath = req.files?.avatar?.[0]?.path
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400, "Avatar file is required")
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()

  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully" )
  )

})


const loginUser = asyncHandler( async(req, res) => {
  // req body -> data
  // username or email
  // find the user 
  // password check
  // access and refresh token
  // send cookies
  
  const {username, email, password} = req.body

  if(!username && !email){
    throw new ApiError(400, "username or email is required")    
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  }).select("+password");

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);


  if(!isPasswordValid){
    throw new ApiError(404, "Invalid user credentials")  
  }

  const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )
 

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,{
        user: loggedInUser, accessToken, refreshToken
      },
      "User logged In Successfully"
    )
  )


})


const logOutUser = asyncHandler( async(req,res) => {
  // find user 
  // remove refresh token from databases
  // clear cookies
  // send reponse
   const userId = req.user._id
   await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
   )
   const options = {
    httpOnly: true,
    secure: true
  }
   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, {}, "User logged Out"))

})


const refreshAccessToken = asyncHandler( async(req,res) => {
  // we take refresh token from database when a message arrive that access token expire
  // then we compare the refresh token from user side to the database
  // if verify then generate access token 
  // login  again without user password and username

  const incomingRefreshToken = req.cookie?.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
     throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken =  jwtVerify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401, "Invalid refresh token");
    }
  
    if(incomingRefreshToken !== user?.refreshToken ){
       throw new ApiError(401, "Refresh token is expired or used");
    }
  
     const options = {
      httpOnly: true,
      secure: true
    }
  
    const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
    return res
     .status(200)
     .Cookie("accessToken", accessToken, options)
     .Cookie("refreshToken", newrefreshToken, options)
     .json(
      new ApiResponse(
        200,
         {},
        {accessToken, refreshToken: newrefreshToken},
        "Access token refreshed")
        )
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token")
    
  }


})

const changeCurrentPassword = asyncHandler( async(req, res) => {
  const {oldPassword, newPassword} = req.body

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
     throw new ApiError(400, "Invalid old password")

     user.password = newPassword
     await user.save({validateBeforeSave: false})

      return res
      .status(200)
      .json(
        newApiResponse(
          200,
          "Password change successfully "
        )
      )
  }
})

const getCurrentUser = asyncHandler( async(req, res) => {
   return req
   .status(200)
   .json(
    200,
    req.user,
    "current user fetched successfully"
   )
})

const updateAccountDetails = asyncHandler( async(req, res) => {
   const {fullName, email} = req.body

   if(!fullName || !email){
    throw new ApiError(400, "All fields are required")
   }

   const user = User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        fullName,
        email
      }
    },
    {new: true}

   ).select("-password")

   return res
   .status(200)
   .json(
    new ApiResponse(
      200,
      user,
      "Account details updated successfully"
    )
   )


})

const updateAvatarFiles = asyncHandler( async(req, res) => {
   const avatarLocalPath = req.file?.path

   if(!avatarLocalPath){
     throw new ApiError(400, "Avatar file is missing")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
  
   if(!avatar || !avatar.url){
    throw new ApiError(400, "Error while uploading on avatar")
   }

   const user  = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar: avatar.url
      }

    },
    {
      new: true
    }

   ).select("-password")

    return res
   .status(200)
   .json(
    new ApiResponse(
      200,
      user,
      "Avatar image update"
    )
   )

   

   


})

const updateCoverImageFiles = asyncHandler( async(req, res) => {
   const CoverImageLocalPath = req.file?.path

   if(!CoverImageLocalPath){
     throw new ApiError(400, "Cover image file is missing")
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  
   if(!coverImage || !coverImage.url){
    throw new ApiError(400, "Error while uploading on cover image")
   }

   const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        CoverImage: CoverImage.url
      }

    },
    {
      new: true
    }

   ).select("-password")

   return res
   .status(200)
   .json(
    new ApiResponse(
      200,
      user,
      "Cover image update"
    )
   )


})



export {
  registerUser, 
  loginUser, 
  logOutUser, 
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatarFiles,
  updateCoverImageFiles

 } 