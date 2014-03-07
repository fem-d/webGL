import sys,string,traceback
from threading import Thread

#vtk2json.py only has one argument: the name of the vtk file to process (include the extension please)

ARRAY_SIZE = 65536*3
# ver - vertices
# ind - indices
# seg - segment
def tesellate(ver,ind, pod, blockID):
    lowerBound  = ARRAY_SIZE*blockID
    upperBound = ARRAY_SIZE*(blockID+1);
    if upperBound > len(ind):
        upperBound = len(ind)
    newindex = dict()
    mapIndexToVertex = dict()
    vtxBlock = []
    idxBlock = []
    pdxBlock = []
    hasPointData = len(pod)>0
    # Set of indices to be processed
    aux = ind[lowerBound:upperBound]
    nidx = -1
    #item = 1
    
    print 'Processing block #' + str(blockID+1) + '['+str(lowerBound)+','+str(upperBound)+']'
    
    try:
    #for each index to be processed
        for oidx in aux:
            # if index hasn't been mapped
            if oidx not in newindex.keys():
                nidx = nidx + 1
                # create new index for the old index (incrementally)
                idxBlock.append(nidx)
                # save in the map for posterior searches
                newindex[oidx] = nidx
                # multiply by three to find the right starting point in the vertex array
                index = oidx * 3
                # add the correspondant vertex into the new position in the new vertex array
                vtxBlock.append(ver[index])
                vtxBlock.append(ver[index+1])
                vtxBlock.append(ver[index+2])
                # add the correspondant point data if any
                if hasPointData :
                    pdxBlock.append(pod[oidx])
            else:
                # if the index was mapped then use it in the new index array
                idxBlock.append(newindex[oidx])
    except:
        #traceback.print_stack()
        raise
    return vtxBlock, idxBlock, pdxBlock
    
def writejson(fname,ver,ind, pod):
    f = open(fname,'w')
    f.write('{\n')
    f.write('  "vertices" : [')
    for v in ver[0:len(ver)-1]:
        f.write(str(v)+',')
    f.write(str(ver[len(ver)-1])+'],\n')
    f.write('  "indices" : [')
    for i in ind[0:len(ind)-1]:
        f.write(str(i)+',')
    f.write(str(ind[len(ind)-1])+']')
    if len(pod) > 0:
        f.write(',\n  "scalars" : [')
        for pd in  pod[0:len(pod)-1]:
            f.write(str(pd)+',')
        f.write(str(pod[len(pod)-1])+']\n')
    else:
        f.write('\n');
    f.write('}')
    f.close()


    
def processBlock(vertices, indices, scalars, blockID):
    fname = sys.argv[1][:-4]
    vv, ii, dd = tesellate(vertices, indices, scalars, blockID)
    filename =fname+'_'+str(blockID)+'.json'
    writejson(filename,vv,ii,dd)
    print 'Block #' + str(blockID) +' processed'


NOWHERE = 0    
POINTS = 1
POLYGONS = 2
POINT_DATA = 3
NORMALS = 4
CELL_DATA = 5
TEXTURE_COORDINATES = 6
SCALARS = 7;
LOOKUP_TABLE = 8;

location = NOWHERE

vertices = []
indices = []
normals = []
scalars = []

linenumber = 0;

for line in open(sys.argv[1], 'r').readlines():
    linenumber = linenumber + 1
    try:
        if line.startswith('POINTS'):
            print line
            location = POINTS
            continue
        elif line.startswith('POLYGONS'):
            print line
            location = POLYGONS
            continue
        elif line.startswith('POINT_DATA'):
            location = POINT_DATA
            continue
        elif line.startswith('NORMALS'):
            print line
            location = NORMALS
            continue
        elif line.startswith('CELL_DATA'):
            print line
            location = CELL_DATA
            continue
        elif line.startswith('TEXTURE_COORDINATES'):
            print line
            location = TEXTURE_COORDINATES
            continue
        elif line.startswith('SCALARS'):
            print line
            location = SCALARS
            continue
        elif line.startswith('LOOKUP_TABLE'):
            print line
            location = LOOKUP_TABLE
            continue
        
        elif location == POINTS:
            for v in line.split():
                vertices.append(float(v))
        
        elif location == POLYGONS:
            tt = line.split()
            if len(tt)>0 and tt[0] != '3':
                raise AssertionError('Not triangles here')
            for i in tt[1:len(tt)]:
                indices.append(int(i))
        
        elif location == LOOKUP_TABLE:
            if line.startswith('LOOKUP_TABLE'):
                continue
            else:
                for pd in line.split():
                    scalars.append(float(pd))
        
        elif location == NORMALS:
            for n in line.split():
                normals.append(float(n))
    except:
        print 'Error while processing line '+str(linenumber)
        print line
        raise

v_count = len(vertices)/3
v_err = (v_count % 3 != 0)        

n_count = len(normals)/3
n_err = (n_count % 3 != 0)

ii_count =len(indices)
i_count = ii_count/3

pd_count = len(scalars)

print 'vertices: ' + str(v_count) +'\n normals: ' + str(n_count) + '\n indices: ' + str(ii_count)+'\n triangle count: ' + str(i_count) + '\n scalars: ' + str(pd_count) + '\n' 

if (v_err or n_err):
    print 'vertex error = ' + str(v_err) +', normal error = ' + str(n_err)
    

numBlocks = ii_count // ARRAY_SIZE
if(ii_count % ARRAY_SIZE != 0):
    numBlocks = numBlocks + 1
print 'Number of Blocks: ' + str(numBlocks)

for i in range(numBlocks):
    try:
        #Thread(target=processBlock, args=(vertices, indices, scalars, i)).start()
        processBlock(vertices, indices, scalars,i);
    except Exception, errtxt:
        print errtxt
    