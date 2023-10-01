const express = require('express');
const request = require('request');
const _ = require('lodash');

const app = express();
const port = 3000;


// Middleware to fetch blog data using curl
app.use('/api/blog-stats', (req, res, next) => {
  const curlUrl = 'https://intent-kit-16.hasura.app/api/rest/blogs'; 

  const headers = {
    'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
    };

  const requestOptions = {
    url: curlUrl,
    method: 'GET',
    headers: headers,
  };

  request(requestOptions, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      return next(new Error('Error fetching data using curlUrl'));
    }   

    const blogData = JSON.parse(body);
    req.blogData = blogData;
    next(); 
  });
});


app.get('/', (req, res) => {
  res.send('Server is running on GET requests.');
});

// Caching
const calculateBlogStats = _.memoize(() => {
  const totalBlogs = req.blogData.length;
  const blogWithLongestTitle = _.maxBy(req.blogData, (blog) => blog.title.length);
  const blogsWithPrivacyInTitle = _.filter(req.blogData, (blog) =>
  blog.title && blog.title.toLowerCase().includes('privacy')
    ).length;
  const uniqueBlogTitles = _.uniq(_.map(req.blogData, 'title'));

  return {
    totalBlogs,
    longestBlogTitle: blogWithLongestTitle ? blogWithLongestTitle.title : 'N/A',
    blogsContainingPrivacy: blogsWithPrivacyInTitle,
    uniqueBlogTitles,
  };
});



app.get('/api/blog-stats', (req, res) => {
  const blogStats = calculateBlogStats(); 
  res.json(blogStats);
 
});


app.get('/api/blog-search', (req, res) => {
  const query = req.query.query && req.query.query.toLowerCase(); 
  const blogData = req.blogData; 
  
  const searchResults = blogData && blogData.filter((blog) =>
    blog.title.toLowerCase().includes(query)
  );

  res.json({
    query,
    searchResults,
  });
});

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: 'There is an Internal Server Error' });
});



app.listen(port, () => {
  console.log(`Server is running Port Number: ${port}`);
});