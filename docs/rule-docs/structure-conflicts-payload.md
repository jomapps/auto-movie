# Structure Conflicts

## Overview

Payloadcms uses /admin and /api paths.
We should not use these paths to avoid conflicts

## Our App
our app will use the homepage /
and then everything else will be /dashboard/*
*CRITICAL* never do /admin/*

## API Routes
ALL our api routes will be /api/v1/*
*CRITICAL* Payloadcms will use the /api routes as they see fit