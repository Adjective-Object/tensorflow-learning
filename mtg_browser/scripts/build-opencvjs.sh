
set -ex

ORIGINAL_DIR=`pwd`

TEMP=$(mktemp -d)

# download emsdk
cd $TEMP
git clone https://github.com/emscripten-core/emsdk.git --depth 1
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# download and build opencv
cd $TEMP
git clone https://github.com/opencv/opencv.git --depth 1
cd opencv
python ./platforms/js/build_js.py build_js \
    --build_wasm \
    --emscripten_dir="$TEMP/emsdk/upstream/emscripten" \
    --clean_build_dir \
    --build_flags "-DBUILD_opencv_calib3d=OFF -DBUILD_ZLIB=OFF -DBUILD_PROTOBUF=OFF -DBUILD_ITT=OFF -DBUILD_opencv_video=OFF -DBUILD_opencv_objdetect=OFF -DBUILD_opencv_dnn=OFF -DBUILD_opencv_photo=OFF"

# copy opencv to public dir
OUT_DIR="$(dirname 0)/../public/lib"
mkdir -p "$OUT_DIR"
cp "$TEMP/opencv/build_js/bin/opencv.js" "$OUT_DIR"

# delete temp dir
cd $ORIGINAL_DIR
rm -rf $TEMP