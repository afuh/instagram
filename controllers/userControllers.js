const mongoose = require('mongoose');
const validator = require('validator');

const User = mongoose.model('User');
const Image = mongoose.model('Image');

exports.showUser = async (req, res, next) => {
  const profile = await User.findOne({ slug: req.params.user }).populate('followers following');
  if (!profile) return next();
  const images = await Image.find({ author: profile._id }).sort({ created: 'desc' }).limit(12).populate('comments');
  res.render('user', { title: profile.username, images, profile });
}


exports.showUserData = (req, res) => {
  res.render('profile', { title: "Edit Profile" });
}

exports.getUser = async (req, res, next) => {
  const user = await User.findOne({ slug: req.params.user })
  if (!user) return next();
  res.render('user', { user, title: user.name });
}

// https://docs.mongodb.com/manual/reference/method/db.collection.findOneAndUpdate/

exports.updateAccount = async (req, res) => {
  const isUrl = validator.isURL(req.body.website, {  protocols: ['http','https'], require_protocol: true });

  const user = await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: {
        name: req.body.name,
        username: req.body.username,
        email: req.body.email,
        website: isUrl ? req.body.website : "",
        bio: req.body.bio
      }
    },
    { new: true, runValidators: true, context: 'query' }
  );
  // req.flash('success', "Updated the profile!");
  res.redirect(`${req.user.slug}`)
}

exports.showLikedImages = async (req, res) => {
  const images = await Image.find({ _id: { $in: req.user.likes } }).populate('comments')
  res.render('likes', {images, title: "Likes"})
}

// exports.showFollowers = async (req, res) => {
//   const follow = await User.findOneAndUpdate(
//     { slug: req.params.user },
//     { $addToSet: { followers: req.user._id} },
//     { new: true }
//   ).populate('followers')
//
//   const following = await User.findOneAndUpdate(
//     { _id: req.user._id },
//     { $addToSet: { following: follow._id} },
//     { new: true }
//   )
//
//   res.json(follow.followers)
// }

exports.showFollowers = async (req, res) => {

  const user = await User.findOne({ slug: req.params.user })

  const followers = user.followers.map(obj => obj.toString());
  const operator = followers.includes(req.user.id) ? '$pull' : '$addToSet';

  const follow = await user.update(
    { [operator]: { followers: req.user._id} },
    { new: true }
  ).populate('followers')

  // const following = await User.findOneAndUpdate(
  //   { _id: req.user._id },
  //   { $addToSet: { following: follow._id} },
  //   { new: true }
  // )

  res.json(user.followers)
}
